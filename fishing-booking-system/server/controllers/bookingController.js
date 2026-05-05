exports.getAllBookings = async (req, res) => {
    try {
        const db = req.app.locals.db;
        const result = await db.query('SELECT * FROM bookings ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { placeId, startTime, duration } = req.body;
        const userId = req.user.id;
        const db = req.app.locals.db;

        const placeResult = await db.query('SELECT * FROM places WHERE id = $1', [placeId]);
        if (placeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Место не найдено' });
        }

        const start = startTime;
        const startDate = new Date(start);
        const end = new Date(startDate.getTime() + (duration * 60 * 60 * 1000)).toISOString();

        const conflictResult = await db.query(
            `SELECT * FROM bookings 
             WHERE place_id = $1 
             AND status = 'approved' 
             AND (
                 ($2 >= start_time AND $2 < end_time) OR
                 ($3 > start_time AND $3 <= end_time) OR
                 ($2 <= start_time AND $3 >= end_time)
             )`,
            [placeId, start, end]
        );

        if (conflictResult.rows.length > 0) {
            return res.status(400).json({ message: 'Место уже забронировано на это время' });
        }

        const id = Date.now().toString();

        await db.query(
            `INSERT INTO bookings (id, user_id, place_id, start_time, end_time, status, catch_amount, extended_count, cancel_requested)
             VALUES ($1, $2, $3, $4, $5, 'pending', 0, 0, false)`,
            [id, userId, placeId, start, end]
        );

        const visitResult = await db.query(
            'SELECT * FROM stats_visits WHERE user_id = $1',
            [userId]
        );

        if (visitResult.rows.length > 0) {
            await db.query(
                'UPDATE stats_visits SET total_hours = total_hours + $1 WHERE user_id = $2',
                [duration, userId]
            );
        } else {
            await db.query(
                'INSERT INTO stats_visits (user_id, username, total_hours) VALUES ($1, $2, $3)',
                [userId, req.user.username, duration]
            );
        }

        const newBooking = {
            id,
            userId,
            placeId,
            startTime: start,
            endTime: end,
            status: 'pending',
            catchAmount: 0,
            extendedCount: 0,
            cancelRequested: false
        };

        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = req.app.locals.db;

        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }

        const booking = bookingResult.rows[0];

        if (req.user.role !== 'admin' && req.user.role !== 'manager' && booking.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const fields = [];
        const values = [];
        let count = 1;

        if (updates.status) {
            fields.push(`status = $${count}`);
            values.push(updates.status);
            count++;
        }
        if (updates.catchAmount !== undefined) {
            fields.push(`catch_amount = $${count}`);
            values.push(updates.catchAmount);
            count++;
        }
        if (updates.extendedCount !== undefined) {
            fields.push(`extended_count = $${count}`);
            values.push(updates.extendedCount);
            count++;
        }

        if (fields.length > 0) {
            values.push(id);
            await db.query(
                `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${count}`,
                values
            );
        }

        const updated = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;

        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }

        const booking = bookingResult.rows[0];

        if (req.user.role !== 'admin' && req.user.role !== 'manager' && booking.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        await db.query(
            "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1",
            [id]
        );

        res.json({ message: 'Бронирование отменено' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.extendBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { additionalHours } = req.body;
        const db = req.app.locals.db;

        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const booking = bookingResult.rows[0];
        const newEndTime = new Date(booking.end_time);
        newEndTime.setHours(newEndTime.getHours() + additionalHours);

        await db.query(
            'UPDATE bookings SET end_time = $1, extended_count = extended_count + 1 WHERE id = $2',
            [newEndTime.toISOString(), id]
        );

        const visitResult = await db.query(
            'SELECT * FROM stats_visits WHERE user_id = $1',
            [booking.user_id]
        );

        if (visitResult.rows.length > 0) {
            await db.query(
                'UPDATE stats_visits SET total_hours = total_hours + $1 WHERE user_id = $2',
                [additionalHours, booking.user_id]
            );
        }

        const updated = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Extend booking error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.db;

        const result = await db.query(
            'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.requestCancel = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;

        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }

        if (bookingResult.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        await db.query(
            "UPDATE bookings SET cancel_requested = true, cancel_requested_at = NOW() WHERE id = $1",
            [id]
        );

        res.json({ message: 'Запрос на отмену отправлен' });
    } catch (error) {
        console.error('Request cancel error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};