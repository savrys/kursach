exports.getTopFishermen = async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const result = await db.query(
            'SELECT * FROM stats_fishing ORDER BY total_catch DESC LIMIT 10'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get top fishermen error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getTopVisitors = async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const result = await db.query(
            'SELECT * FROM stats_visits ORDER BY total_hours DESC LIMIT 10'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get top visitors error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.updateVisitTime = async (req, res) => {
    try {
        const { hours } = req.body;
        const userId = req.user.id;
        const db = req.app.locals.db;
        
        const visitStat = await db.query(
            'SELECT * FROM stats_visits WHERE user_id = $1',
            [userId]
        );
        
        if (visitStat.rows.length > 0) {
            await db.query(
                'UPDATE stats_visits SET total_hours = total_hours + $1 WHERE user_id = $2',
                [hours, userId]
            );
        } else {
            await db.query(
                'INSERT INTO stats_visits (user_id, username, total_hours) VALUES ($1, $2, $3)',
                [userId, req.user.username, hours]
            );
        }
        
        res.json({ message: 'Время посещения обновлено' });
    } catch (error) {
        console.error('Update visit time error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};