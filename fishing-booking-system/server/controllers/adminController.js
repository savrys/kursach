exports.getAllUsers = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        const users = db.users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const db = req.app.locals.readDB();
        
        const user = db.users.find(u => u.id === id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin' && role !== 'admin') {
            return res.status(400).json({ message: 'Cannot change admin role' });
        }

        user.role = role;
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error updating user' });
        }

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const userIndex = db.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (db.users[userIndex].role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin user' });
        }

        db.users.splice(userIndex, 1);
        
        // Удаляем связанные данные
        db.bookings = db.bookings.filter(b => b.userId !== id);
        db.chats = db.chats.filter(c => c.userId !== id);
        db.messages = db.messages.filter(m => m.senderId !== id);
        db.stats.fishing = db.stats.fishing.filter(s => s.userId !== id);
        db.stats.visits = db.stats.visits.filter(v => v.userId !== id);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error deleting user' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};