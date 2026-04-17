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

// Путь к файлу базы данных
const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Инициализация базы данных если её нет
if (!fs.existsSync(DB_PATH)) {
    const initialData = {
        users: [],
        places: [],
        bookings: [],
        catches: [],
        chats: [],
        messages: [],
        stats: {
            fishing: [],
            visits: []
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
// Создаем админа при первом запуске
const initializeAdmin = () => {
    const bcrypt = require('bcryptjs');
    const db = readDB();
    
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
    initializeAdmin();
});
