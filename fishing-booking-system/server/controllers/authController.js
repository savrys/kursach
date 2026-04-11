const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const JWT_SECRET = 'your-secret-key-change-this-in-production';

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;
        const db = req.app.locals.readDB();

        // Проверка существующего пользователя
        const existingUser = db.users.find(u => u.email === email || u.username === username);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание нового пользователя
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error saving user' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = req.app.locals.readDB();

        // Поиск пользователя
        const user = db.users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const db = req.app.locals.readDB();
        
        const user = db.users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};