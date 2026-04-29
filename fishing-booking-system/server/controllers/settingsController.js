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