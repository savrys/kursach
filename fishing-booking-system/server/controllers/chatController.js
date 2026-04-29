exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.db;
        
        let chats;
        if (req.user.role === 'manager' || req.user.role === 'admin') {
            // Менеджеры и админы видят все чаты
            const result = await db.query(
                'SELECT * FROM chats ORDER BY updated_at DESC'
            );
            chats = result.rows;
        } else {
            // Обычные пользователи видят только свои чаты
            const result = await db.query(
                'SELECT * FROM chats WHERE user_id = $1 ORDER BY updated_at DESC',
                [userId]
            );
            chats = result.rows;
        }

        // Добавляем информацию о пользователях и последнем сообщении
        const chatsWithUsers = await Promise.all(chats.map(async (chat) => {
            const userResult = await db.query(
                'SELECT id, username FROM users WHERE id = $1',
                [chat.user_id]
            );
            
            const lastMsgResult = await db.query(
                'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
                [chat.id]
            );
            
            return {
                id: chat.id,
                userId: chat.user_id,
                username: userResult.rows[0]?.username || 'Unknown',
                lastMessage: lastMsgResult.rows[0] || null,
                createdAt: chat.created_at,
                updatedAt: chat.updated_at
            };
        }));

        res.json(chatsWithUsers);
    } catch (error) {
        console.error('Get user chats error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.createChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.db;
        
        // Проверяем, существует ли уже чат
        const existingChat = await db.query(
            'SELECT * FROM chats WHERE user_id = $1',
            [userId]
        );
        
        if (existingChat.rows.length > 0) {
            const chat = existingChat.rows[0];
            return res.json({
                id: chat.id,
                userId: chat.user_id,
                createdAt: chat.created_at,
                updatedAt: chat.updated_at
            });
        }

        const id = Date.now().toString();
        const now = new Date().toISOString();
        
        await db.query(
            'INSERT INTO chats (id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4)',
            [id, userId, now, now]
        );

        const newChat = {
            id,
            userId,
            createdAt: now,
            updatedAt: now
        };

        res.status(201).json(newChat);
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const db = req.app.locals.db;
        
        // Проверяем существование чата
        const chatResult = await db.query('SELECT * FROM chats WHERE id = $1', [chatId]);
        
        if (chatResult.rows.length === 0) {
            return res.status(404).json({ message: 'Чат не найден' });
        }

        const chat = chatResult.rows[0];

        // Проверка доступа
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && chat.user_id !== userId) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const messages = await db.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
            [chatId]
        );

        // Преобразуем поля из snake_case в camelCase для совместимости с фронтендом
        const formattedMessages = messages.rows.map(m => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            text: m.text,
            createdAt: m.created_at,
            read: m.read
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text } = req.body;
        const senderId = req.user.id;
        const db = req.app.locals.db;
        
        // Проверяем существование чата
        const chatResult = await db.query('SELECT * FROM chats WHERE id = $1', [chatId]);
        
        if (chatResult.rows.length === 0) {
            return res.status(404).json({ message: 'Чат не найден' });
        }

        const chat = chatResult.rows[0];

        // Проверка доступа
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && chat.user_id !== senderId) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const id = Date.now().toString();
        const now = new Date().toISOString();
        
        await db.query(
            'INSERT INTO messages (id, chat_id, sender_id, text, read, created_at) VALUES ($1, $2, $3, $4, false, $5)',
            [id, chatId, senderId, text, now]
        );

        // Обновляем время чата
        await db.query(
            'UPDATE chats SET updated_at = $1 WHERE id = $2',
            [now, chatId]
        );

        const newMessage = {
            id,
            chatId,
            senderId,
            text,
            createdAt: now,
            read: false
        };

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.deleteChat = async (req, res) => {
    const client = await req.app.locals.db.pool.connect();
    
    try {
        const { chatId } = req.params;
        
        // Только менеджер или админ может удалять чаты
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const chatResult = await client.query('SELECT * FROM chats WHERE id = $1', [chatId]);
        
        if (chatResult.rows.length === 0) {
            return res.status(404).json({ message: 'Чат не найден' });
        }

        await client.query('BEGIN');
        
        // Удаляем сообщения чата
        await client.query('DELETE FROM messages WHERE chat_id = $1', [chatId]);
        
        // Удаляем чат
        await client.query('DELETE FROM chats WHERE id = $1', [chatId]);
        
        await client.query('COMMIT');

        res.json({ message: 'Чат удалён' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete chat error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const db = req.app.locals.db;
        
        const result = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Сообщение не найдено' });
        }
        
        await db.query('UPDATE messages SET read = true WHERE id = $1', [messageId]);
        
        res.json({ message: 'Сообщение отмечено как прочитанное', messageId });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};