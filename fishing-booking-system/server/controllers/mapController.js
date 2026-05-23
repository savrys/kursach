const getLocalTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

exports.getAllPlaces = async (req, res) => {
    try {
        const db = req.app.locals.db;
        const now = getLocalTimeString();
        
        await db.query(
            "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE status = 'approved' AND local_end < $1",
            [now]
        );
        
        const placesResult = await db.query('SELECT * FROM places ORDER BY created_at');
        let places = placesResult.rows;
        
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
        
        const placesWithStatus = await Promise.all(places.map(async (place) => {
            const activeBooking = await db.query(
                `SELECT b.*, u.username 
                 FROM bookings b 
                 JOIN users u ON b.user_id = u.id 
                 WHERE b.place_id = $1 
                 AND b.status = 'approved' 
                 AND b.local_start <= $2 
                 AND b.local_end >= $2
                 LIMIT 1`,
                [place.id, now]
            );
            
            const pendingBooking = await db.query(
                `SELECT * FROM bookings WHERE place_id = $1 AND status = 'pending' LIMIT 1`,
                [place.id]
            );
            
            let status = 'free';
            let bookingInfo = null;
            
            if (activeBooking.rows.length > 0) {
                const b = activeBooking.rows[0];
                
                // Проверяем флаг cancel_requested - синий цвет
                if (b.cancel_requested) {
                    status = 'pending_cancel';
                } else {
                    status = 'occupied';
                }
                
                const endDateTime = new Date(b.local_end);
                const nowDateTime = new Date();
                const timeRemaining = Math.max(0, endDateTime.getTime() - nowDateTime.getTime());
                
                bookingInfo = {
                    bookingId: b.id,
                    username: b.username || 'Unknown',
                    timeRemaining: timeRemaining,
                    catchAmount: b.catch_amount || 0,
                    endTime: b.local_end
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
        const now = getLocalTimeString();
        
        const activeBooking = await db.query(
            `SELECT b.*, u.username 
             FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             WHERE b.place_id = $1 
             AND b.status = 'approved' 
             AND b.local_start <= $2 
             AND b.local_end >= $2
             LIMIT 1`,
            [id, now]
        );
        
        if (activeBooking.rows.length === 0) {
            return res.json({ status: 'free' });
        }
        
        const b = activeBooking.rows[0];
        const endDateTime = new Date(b.local_end);
        const nowDateTime = new Date();
        const timeRemaining = Math.max(0, endDateTime.getTime() - nowDateTime.getTime());
        
        let status = 'occupied';
        if (b.cancel_requested) {
            status = 'pending_cancel';
        }
        
        res.json({
            status: status,
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