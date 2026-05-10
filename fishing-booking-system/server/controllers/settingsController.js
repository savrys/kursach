exports.getMapImage = async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const result = await db.query(
            "SELECT value FROM settings WHERE key = 'mapImage'"
        );
        
        const mapImage = result.rows.length > 0 ? result.rows[0].value : null;
        
        res.json({ image: mapImage });
    } catch (error) {
        console.error('Get map image error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Получить информацию о базе отдыха (публичный)
exports.getInfo = async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const result = await db.query(
            "SELECT value FROM settings WHERE key = 'baseInfo'"
        );
        
        const info = result.rows.length > 0 ? result.rows[0].value : '{"left":"","right":""}';
        
        res.json(JSON.parse(info));
    } catch (error) {
        console.error('Get info error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Обновить информацию о базе отдыха (только менеджер/админ)
exports.updateInfo = async (req, res) => {
    try {
        const { left, right } = req.body;
        const db = req.app.locals.db;
        
        const info = JSON.stringify({ left: left || '', right: right || '' });
        
        const existing = await db.query("SELECT * FROM settings WHERE key = 'baseInfo'");
        
        if (existing.rows.length > 0) {
            await db.query("UPDATE settings SET value = $1 WHERE key = 'baseInfo'", [info]);
        } else {
            await db.query("INSERT INTO settings (key, value) VALUES ('baseInfo', $1)", [info]);
        }
        
        res.json({ message: 'Информация обновлена' });
    } catch (error) {
        console.error('Update info error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};