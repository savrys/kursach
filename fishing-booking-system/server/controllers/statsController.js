exports.getTopFishermen = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        const topFishermen = db.stats.fishing
            .sort((a, b) => b.totalCatch - a.totalCatch)
            .slice(0, 10);
        
        res.json(topFishermen);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTopVisitors = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        const topVisitors = db.stats.visits
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 10);
        
        res.json(topVisitors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateVisitTime = async (req, res) => {
    try {
        const { hours } = req.body;
        const userId = req.user.id;
        const db = req.app.locals.readDB();
        
        const visitStat = db.stats.visits.find(v => v.userId === userId);
        if (visitStat) {
            visitStat.totalHours += hours;
        } else {
            db.stats.visits.push({
                userId,
                username: req.user.username,
                totalHours: hours
            });
        }
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error updating visit time' });
        }

        res.json({ message: 'Visit time updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};