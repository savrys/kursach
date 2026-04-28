const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { pool, initTables } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Инициализация таблиц PostgreSQL
initTables();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware для кеширования (RESTful)
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=5');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Middleware для аудита (журнал действий)
const auditLog = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            user: req.user?.username || 'anonymous',
            role: req.user?.role || 'guest',
            status: res.statusCode,
            ip: req.ip
        };
        
        const logFile = path.join(__dirname, 'data', 'audit.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        
        originalSend.call(this, data);
    };
    
    next();
};

app.use(auditLog);

// Делаем БД доступной для всех маршрутов
app.locals.db = require('./database');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const mapRoutes = require('./routes/map');
const chatRoutes = require('./routes/chats');
const adminRoutes = require('./routes/admin');
const managerRoutes = require('./routes/manager');
const userRoutes = require('./routes/user');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');

// Использование маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Обработка 404
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Ресурс не найден',
        path: req.originalUrl 
    });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        message: 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Попробуйте позже'
    });
});

// Создаем админа при первом запуске
const initializeAdmin = async () => {
    const bcrypt = require('bcryptjs');
    const db = app.locals.db;
    
    try {
        const result = await db.query(
            "SELECT * FROM users WHERE role = 'admin'"
        );
        
        if (result.rows.length === 0) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            const id = Date.now().toString();
            
            await db.query(
                'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
                [id, 'admin', 'admin@fishing.com', hashedPassword, 'admin']
            );
            
            console.log('Admin user created: username: admin, password: admin123');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database: PostgreSQL`);
    console.log(`Cache: enabled (GET: 5s, POST/PUT/DELETE: no-store)`);
    console.log(`Audit: enabled (./data/audit.log)`);
    initializeAdmin();
});