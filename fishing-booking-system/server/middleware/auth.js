const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key-change-this-in-production';

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const db = req.app.locals.readDB();
        const user = db.users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};