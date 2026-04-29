exports.getAllUsers = async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const result = await db.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const db = req.app.locals.db;
        
        // Проверяем существование пользователя
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        const user = userResult.rows[0];
        
        // Нельзя изменить роль админа
        if (user.role === 'admin' && role !== 'admin') {
            return res.status(400).json({ message: 'Нельзя изменить роль администратора' });
        }
        
        // Обновляем роль
        await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        
        res.json({ message: 'Роль пользователя обновлена' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.deleteUser = async (req, res) => {
    const client = await req.app.locals.db.pool.connect();
    
    try {
        const { id } = req.params;
        
        await client.query('BEGIN');
        
        // Проверяем существование пользователя
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        if (userResult.rows[0].role === 'admin') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Нельзя удалить администратора' });
        }
        
        // Удаляем связанные данные
        await client.query('DELETE FROM messages WHERE sender_id = $1', [id]);
        await client.query('DELETE FROM chats WHERE user_id = $1', [id]);
        await client.query('DELETE FROM bookings WHERE user_id = $1', [id]);
        await client.query('DELETE FROM stats_fishing WHERE user_id = $1', [id]);
        await client.query('DELETE FROM stats_visits WHERE user_id = $1', [id]);
        
        // Удаляем пользователя
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Пользователь удалён' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
};