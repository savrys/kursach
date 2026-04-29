exports.getAllPlaces = async (req, res) => {
    try {
        const db = req.app.locals.db;
        const now = new Date().toISOString();
        
        // Получаем все места
        const placesResult = await db.query('SELECT * FROM places ORDER BY created_at');
        
        let places = placesResult.rows;
        
        // Если мест нет, создаём начальные
        if (places.length === 0) {
            const initialPlaces = [
                { id: '1', name: 'Место #1', x: 100, y: 100, description: 'Хорошее место для ловли карпа', maxCapacity: 3 },
                { id: '2', name: 'Место #2', x: 250, y: 150, description: 'Глубокое место, много сома', maxCapacity: 2 },
                { id: '3', name: 'Место #3', x: 400, y: 200, description: 'Мелководье, идеально для начинающих', maxCapacity: 4 },
                { id: '4', name: 'Место #4', x: 150, y: 300, description: 'Рядом с камышами, много щуки', maxCapacity: 2 },
                { id: '5', name: 'Место #5', x: 350, y: 350, description: 'VIP место с навесом', maxCapacity: 2 }
            ];
            
            for (const p of initialPlaces) {
                await db.query(
                    'INSERT INTO places (id, name, coordinates_x, coordinates_y, description, max_capacity) VALUES ($1, $2, $3, $4, $5, $6)',
                    [p.id, p.name, p.x, p.y, p.description, p.maxCapacity]
                );
            }
            
            const refreshed = await db.query('SELECT * FROM places ORDER BY created_at');
            places = refreshed.rows;
        }
        
        // Для каждого места получаем статус
        const placesWithStatus = await Promise.all(places.map(async (place) => {
            // Активное бронирование
            const activeBooking = await db.query(
                `SELECT b.*, u.username 
                 FROM bookings b 
                 JOIN users u ON b.user_id = u.id 
                 WHERE b.place_id = $1 
                 AND b.status = 'approved' 
                 AND b.start_time <= $2 
                 AND b.end_time >= $2
                 LIMIT 1`,
                [place.id, now]
            );
            
            // Ожидающее бронирование
            const pendingBooking = await db.query(
                `SELECT * FROM bookings 
                 WHERE place_id = $1 AND status = 'pending' 
                 LIMIT 1`,
                [place.id]
            );
            
            let status = 'free';
            let bookingInfo = null;
            
            if (activeBooking.rows.length > 0) {
                status = 'occupied';
                const b = activeBooking.rows[0];
                const timeRemaining = Math.max(0, new Date(b.end_time) - new Date());
                bookingInfo = {
                    bookingId: b.id,
                    username: b.username || 'Unknown',
                    timeRemaining: timeRemaining,
                    catchAmount: b.catch_amount || 0,
                    endTime: b.end_time
                };
            } else if (pendingBooking.rows.length > 0) {
                status = 'pending';
            }
            
            return {
                id: place.id,
                name: place.name,
                coordinates: { x: place.coordinates_x, y: place.coordinates_y },
                description: place.description,
                maxCapacity: place.max_capacity,
                image: place.image,
                status,
                bookingInfo
            };
        }));
        
        res.json(placesWithStatus);
    } catch (error) {
        console.error('Get places error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getPlaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        
        const result = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Место не найдено' });
        }
        
        const place = result.rows[0];
        
        res.json({
            id: place.id,
            name: place.name,
            coordinates: { x: place.coordinates_x, y: place.coordinates_y },
            description: place.description,
            maxCapacity: place.max_capacity,
            image: place.image,
            createdAt: place.created_at
        });
    } catch (error) {
        console.error('Get place by id error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getPlaceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        const now = new Date().toISOString();
        
        const activeBooking = await db.query(
            `SELECT b.*, u.username 
             FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             WHERE b.place_id = $1 
             AND b.status = 'approved' 
             AND b.start_time <= $2 
             AND b.end_time >= $2
             LIMIT 1`,
            [id, now]
        );
        
        if (activeBooking.rows.length === 0) {
            return res.json({ status: 'free' });
        }
        
        const b = activeBooking.rows[0];
        const timeRemaining = Math.max(0, new Date(b.end_time) - new Date());
        
        res.json({
            status: 'occupied',
            bookingId: b.id,
            username: b.username || 'Unknown',
            timeRemaining: timeRemaining,
            catchAmount: b.catch_amount || 0
        });
    } catch (error) {
        console.error('Get place status error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};