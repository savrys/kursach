exports.getPendingBookings = async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        // Заявки на бронирование (pending) И запросы на отмену (cancel_requested = true)
        const result = await db.query(
            `SELECT b.*, u.username, p.name as place_name 
             FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             JOIN places p ON b.place_id = p.id 
             WHERE b.status = 'pending' OR b.cancel_requested = true
             ORDER BY b.created_at DESC`
        );
        
        const bookings = result.rows.map(b => ({
            id: b.id,
            userId: b.user_id,
            placeId: b.place_id,
            startTime: b.local_start || b.start_time,
            endTime: b.local_end || b.end_time,
            status: b.status,
            catchAmount: b.catch_amount,
            extendedCount: b.extended_count,
            cancelRequested: b.cancel_requested,
            createdAt: b.created_at,
            username: b.username,
            placeName: b.place_name,
            local_start: b.local_start,
            local_end: b.local_end
        }));
        
        res.json(bookings);
    } catch (error) {
        console.error('Get pending bookings error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getActiveUsers = async (req, res) => {
    try {
        const db = req.app.locals.db;
        const now = new Date();
        const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        
        const result = await db.query(
            `SELECT DISTINCT u.id, u.username, u.email, u.role 
             FROM users u 
             JOIN bookings b ON u.id = b.user_id 
             WHERE b.status = 'approved' 
             AND b.local_start <= $1 
             AND b.local_end >= $1`,
            [nowStr]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get active users error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.approveBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        
        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }
        
        const booking = bookingResult.rows[0];
        
        const conflictResult = await db.query(
            `SELECT * FROM bookings 
             WHERE place_id = $1 
             AND status = 'approved' 
             AND id != $2
             AND (
                 ($3 >= local_start AND $3 < local_end) OR
                 ($4 > local_start AND $4 <= local_end) OR
                 ($3 <= local_start AND $4 >= local_end)
             )`,
            [booking.place_id, id, booking.local_start, booking.local_end]
        );
        
        if (conflictResult.rows.length > 0) {
            return res.status(400).json({ message: 'Место уже забронировано на это время' });
        }
        
        await db.query(
            `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = $1 WHERE id = $2`,
            [req.user.id, id]
        );
        
        const updated = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        res.json({ 
            message: 'Бронирование подтверждено',
            booking: updated.rows[0]
        });
    } catch (error) {
        console.error('Approve booking error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        
        const result = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }
        
        await db.query(
            `UPDATE bookings SET status = 'rejected', rejected_at = NOW(), rejected_by = $1 WHERE id = $2`,
            [req.user.id, id]
        );
        
        res.json({ message: 'Бронирование отклонено' });
    } catch (error) {
        console.error('Reject booking error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.approveCancelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        
        await db.query(
            "UPDATE bookings SET status = 'cancelled', cancel_requested = false, cancelled_at = NOW(), cancelled_by = $1 WHERE id = $2",
            [req.user.id, id]
        );
        
        res.json({ message: 'Заявка на отмену одобрена' });
    } catch (error) {
        console.error('Approve cancel error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.rejectCancelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        
        await db.query(
            'UPDATE bookings SET cancel_requested = false WHERE id = $1',
            [id]
        );
        
        res.json({ message: 'Заявка на отмену отклонена' });
    } catch (error) {
        console.error('Reject cancel error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.createPlace = async (req, res) => {
    try {
        const { name, coordinates, description, maxCapacity } = req.body;
        const db = req.app.locals.db;
        
        const id = Date.now().toString();
        
        await db.query(
            `INSERT INTO places (id, name, coordinates_x, coordinates_y, description, max_capacity) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, coordinates.x, coordinates.y, description || '', maxCapacity || 2]
        );
        
        const newPlace = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        
        res.status(201).json(newPlace.rows[0]);
    } catch (error) {
        console.error('Create place error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.updatePlace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, coordinates, description, maxCapacity } = req.body;
        const db = req.app.locals.db;
        
        const result = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Место не найдено' });
        }
        
        await db.query(
            `UPDATE places SET 
             name = COALESCE($1, name),
             coordinates_x = COALESCE($2, coordinates_x),
             coordinates_y = COALESCE($3, coordinates_y),
             description = COALESCE($4, description),
             max_capacity = COALESCE($5, max_capacity)
             WHERE id = $6`,
            [name, coordinates?.x, coordinates?.y, description, maxCapacity, id]
        );
        
        const updated = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Update place error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.deletePlace = async (req, res) => {
    const client = await req.app.locals.db.pool.connect();
    
    try {
        const { id } = req.params;
        
        await client.query('BEGIN');
        
        const result = await client.query('SELECT * FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Место не найдено' });
        }
        
        const now = new Date();
        const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        
        // Проверяем активные брони
        const activeBookings = await client.query(
            "SELECT * FROM bookings WHERE place_id = $1 AND status = 'approved' AND local_end >= $2",
            [id, nowStr]
        );
        
        if (activeBookings.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Нельзя удалить место с активными бронированиями' });
        }
        
        // Удаляем старые брони на это место
        await client.query('DELETE FROM bookings WHERE place_id = $1', [id]);
        
        // Удаляем место
        await client.query('DELETE FROM places WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Место удалено' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete place error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
};

exports.addCatch = async (req, res) => {
    try {
        const { userId, bookingId, amount } = req.body;
        const db = req.app.locals.db;
        
        const catchAmount = parseFloat(amount);
        
        if (isNaN(catchAmount) || catchAmount <= 0) {
            return res.status(400).json({ message: 'Некорректное количество улова' });
        }
        
        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }
        
        await db.query(
            'UPDATE bookings SET catch_amount = ROUND((catch_amount + $1)::numeric, 1) WHERE id = $2',
            [catchAmount, bookingId]
        );
        
        const statResult = await db.query('SELECT * FROM stats_fishing WHERE user_id = $1', [userId]);
        
        if (statResult.rows.length > 0) {
            await db.query(
                'UPDATE stats_fishing SET total_catch = ROUND((total_catch + $1)::numeric, 1) WHERE user_id = $2',
                [catchAmount, userId]
            );
        } else {
            const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
            await db.query(
                'INSERT INTO stats_fishing (user_id, username, total_catch) VALUES ($1, $2, $3)',
                [userId, userResult.rows[0]?.username || 'Unknown', Math.round(catchAmount * 10) / 10]
            );
        }
        
        const updatedBooking = await db.query('SELECT catch_amount FROM bookings WHERE id = $1', [bookingId]);
        const totalStat = await db.query('SELECT total_catch FROM stats_fishing WHERE user_id = $1', [userId]);
        
        res.json({ 
            message: 'Улов добавлен',
            bookingCatch: updatedBooking.rows[0].catch_amount,
            totalCatch: totalStat.rows[0]?.total_catch || catchAmount
        });
    } catch (error) {
        console.error('Add catch error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.clearFishingStats = async (req, res) => {
    try {
        const db = req.app.locals.db;
        await db.query('DELETE FROM stats_fishing');
        res.json({ message: 'Статистика улова очищена' });
    } catch (error) {
        console.error('Clear fishing stats error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.clearVisitsStats = async (req, res) => {
    try {
        const db = req.app.locals.db;
        await db.query('DELETE FROM stats_visits');
        res.json({ message: 'Статистика посещений очищена' });
    } catch (error) {
        console.error('Clear visits stats error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.uploadMapImage = async (req, res) => {
    try {
        const { image } = req.body;
        const db = req.app.locals.db;
        
        const existing = await db.query("SELECT * FROM settings WHERE key = 'mapImage'");
        
        if (existing.rows.length > 0) {
            await db.query("UPDATE settings SET value = $1 WHERE key = 'mapImage'", [image]);
        } else {
            await db.query("INSERT INTO settings (key, value) VALUES ('mapImage', $1)", [image]);
        }
        
        res.json({ message: 'Карта сохранена' });
    } catch (error) {
        console.error('Upload map image error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.deleteMapImage = async (req, res) => {
    try {
        const db = req.app.locals.db;
        await db.query("DELETE FROM settings WHERE key = 'mapImage'");
        res.json({ message: 'Карта удалена' });
    } catch (error) {
        console.error('Delete map image error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.uploadPlaceImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image } = req.body;
        const db = req.app.locals.db;
        
        const result = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Место не найдено' });
        }
        
        await db.query('UPDATE places SET image = $1 WHERE id = $2', [image, id]);
        
        res.json({ message: 'Фото места сохранено', image });
    } catch (error) {
        console.error('Upload place image error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.deletePlaceImage = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        
        const result = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Место не найдено' });
        }
        
        await db.query('UPDATE places SET image = NULL WHERE id = $1', [id]);
        
        res.json({ message: 'Фото места удалено' });
    } catch (error) {
        console.error('Delete place image error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};