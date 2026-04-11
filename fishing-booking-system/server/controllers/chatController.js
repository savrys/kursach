exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.readDB();
        
        let chats;
        if (req.user.role === 'manager' || req.user.role === 'admin') {
            // Менеджеры и админы видят все чаты
            chats = db.chats;
        } else {
            // Обычные пользователи видят только свои чаты
            chats = db.chats.filter(c => c.userId === userId);
        }

        // Добавляем информацию о пользователях
        const chatsWithUsers = chats.map(chat => {
            const user = db.users.find(u => u.id === chat.userId);
            const lastMessage = db.messages
                .filter(m => m.chatId === chat.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            
            return {
                ...chat,
                username: user?.username || 'Unknown',
                lastMessage: lastMessage || null
            };
        });

        res.json(chatsWithUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.readDB();
        
        // Проверяем, существует ли уже чат
        const existingChat = db.chats.find(c => c.userId === userId);
        if (existingChat) {
            return res.json(existingChat);
        }

        const newChat = {
            id: Date.now().toString(),
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.chats.push(newChat);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error creating chat' });
        }

        res.status(201).json(newChat);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const db = req.app.locals.readDB();
        
        const chat = db.chats.find(c => c.id === chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Проверка доступа
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
            chat.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = db.messages
            .filter(m => m.chatId === chatId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text } = req.body;
        const senderId = req.user.id;
        const db = req.app.locals.readDB();
        
        const chat = db.chats.find(c => c.id === chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Проверка доступа
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
            chat.userId !== senderId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const newMessage = {
            id: Date.now().toString(),
            chatId,
            senderId,
            text,
            createdAt: new Date().toISOString(),
            read: false
        };

        db.messages.push(newMessage);
        chat.updatedAt = new Date().toISOString();
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error sending message' });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const db = req.app.locals.readDB();
        
        // Только менеджер или админ может удалять чаты
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const chatIndex = db.chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Удаляем чат и все сообщения
        db.chats.splice(chatIndex, 1);
        db.messages = db.messages.filter(m => m.chatId !== chatId);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error deleting chat' });
        }

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};