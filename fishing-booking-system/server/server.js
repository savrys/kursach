const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Путь к файлу базы данных
const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Инициализация базы данных если её нет
if (!fs.existsSync(DB_PATH)) {
    const initialData = {
        users: [],
        places: [
            {
                id: "1",
                name: "Место #1",
                coordinates: { x: 100, y: 100 },
                description: "Хорошее место для ловли карпа",
                maxCapacity: 3,
                createdAt: new Date().toISOString()
            },
            {
                id: "2",
                name: "Место #2",
                coordinates: { x: 250, y: 150 },
                description: "Глубокое место, много сома",
                maxCapacity: 2,
                createdAt: new Date().toISOString()
            },
            {
                id: "3",
                name: "Место #3",
                coordinates: { x: 400, y: 200 },
                description: "Мелководье, идеально для начинающих",
                maxCapacity: 4,
                createdAt: new Date().toISOString()
            },
            {
                id: "4",
                name: "Место #4",
                coordinates: { x: 150, y: 300 },
                description: "Рядом с камышами, много щуки",
                maxCapacity: 2,
                createdAt: new Date().toISOString()
            },
            {
                id: "5",
                name: "Место #5",
                coordinates: { x: 350, y: 350 },
                description: "VIP место с навесом",
                maxCapacity: 2,
                createdAt: new Date().toISOString()
            }
        ],
        bookings: [],
        catches: [],
        chats: [],
        messages: [],
        stats: {
            fishing: [],
            visits: []
        },
        settings: {
            mapImage: null
        }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

// Функция для чтения базы данных
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return null;
    }
};

// Функция для записи в базу данных
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing to database:', error);
        return false;
    }
};

// Делаем функции доступными для всех маршрутов
app.locals.readDB = readDB;
app.locals.writeDB = writeDB;

// Автоматическое резервное копирование каждые 30 минут
setInterval(() => {
    const backupDir = path.join(__dirname, 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = path.join(backupDir, `backup-${Date.now()}.json`);
    try {
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, backupPath);
            console.log('Backup created:', backupPath);
            
            // Храним только последние 5 бекапов
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('backup-'))
                .sort()
                .reverse();
            
            backups.slice(5).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f));
                console.log('Old backup deleted:', f);
            });
        }
    } catch (error) {
        console.error('Backup error:', error);
    }
}, 30 * 60 * 1000);

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
const initializeAdmin = () => {
    const bcrypt = require('bcryptjs');
    const db = readDB();
    
    if (!db) {
        console.error('Failed to read database');
        return;
    }
    
    const adminExists = db.users.some(user => user.role === 'admin');
    
    if (!adminExists) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const admin = {
            id: Date.now().toString(),
            username: 'admin',
            email: 'admin@fishing.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        db.users.push(admin);
        writeDB(db);
        console.log('Admin user created: username: admin, password: admin123');
    }
};

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Cache: enabled (GET: 5s, POST/PUT/DELETE: no-store)`);
    console.log(`Audit: enabled (./data/audit.log)`);
    console.log(`Backups: enabled (./data/backups/, every 30 min, keep 5)`);
    initializeAdmin();
});