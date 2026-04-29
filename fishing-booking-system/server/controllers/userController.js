exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.db;
        
        // Получаем пользователя
        const userResult = await db.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Получаем бронирования
        const bookingsResult = await db.query(
            'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        // Получаем статистику
        const fishingResult = await db.query(
            'SELECT * FROM stats_fishing WHERE user_id = $1',
            [userId]
        );
        
        const visitsResult = await db.query(
            'SELECT * FROM stats_visits WHERE user_id = $1',
            [userId]
        );
        
        // Преобразуем бронирования для фронтенда
        const bookings = bookingsResult.rows.map(b => ({
            id: b.id,
            userId: b.user_id,
            placeId: b.place_id,
            startTime: b.start_time,
            endTime: b.end_time,
            status: b.status,
            catchAmount: b.catch_amount,
            extendedCount: b.extended_count,
            cancelRequested: b.cancel_requested,
            createdAt: b.created_at,
            approvedAt: b.approved_at,
            cancelledAt: b.cancelled_at
        }));
        
        res.json({
            user: userResult.rows[0],
            bookings: bookings,
            stats: {
                fishing: fishingResult.rows[0] || { totalCatch: 0 },
                visits: visitsResult.rows[0] || { totalHours: 0 }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;
        const db = req.app.locals.db;
        
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Обновляем только переданные поля
        if (username) {
            await db.query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
        }
        if (email) {
            await db.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
        }
        
        // Получаем обновлённого пользователя
        const updated = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [userId]
        );
        
        res.json({
            message: 'Профиль обновлён',
            user: updated.rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.createBookingRequest = async (req, res) => {
    try {
        const { placeId, startTime, duration } = req.body;
        const userId = req.user.id;
        const db = req.app.locals.db;
        
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 3600000);
        const id = Date.now().toString();
        
        await db.query(
            `INSERT INTO bookings (id, user_id, place_id, start_time, end_time, status, catch_amount, extended_count, cancel_requested)
             VALUES ($1, $2, $3, $4, $5, 'pending', 0, 0, false)`,
            [id, userId, placeId, start.toISOString(), end.toISOString()]
        );
        
        const newBooking = {
            id,
            userId,
            placeId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: 'pending',
            catchAmount: 0,
            extendedCount: 0,
            cancelRequested: false
        };
        
        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Create booking request error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};