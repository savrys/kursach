exports.getAllPlaces = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        
        // Инициализация мест если их нет
        if (db.places.length === 0) {
            const initialPlaces = [
                { id: '1', name: 'Место #1', coordinates: { x: 100, y: 100 }, description: 'Хорошее место для ловли карпа', maxCapacity: 3 },
                { id: '2', name: 'Место #2', coordinates: { x: 250, y: 150 }, description: 'Глубокое место, много сома', maxCapacity: 2 },
                { id: '3', name: 'Место #3', coordinates: { x: 400, y: 200 }, description: 'Мелководье, идеально для начинающих', maxCapacity: 4 },
                { id: '4', name: 'Место #4', coordinates: { x: 150, y: 300 }, description: 'Рядом с камышами, много щуки', maxCapacity: 2 },
                { id: '5', name: 'Место #5', coordinates: { x: 350, y: 350 }, description: 'VIP место с навесом', maxCapacity: 2 }
            ];
            db.places = initialPlaces;
            req.app.locals.writeDB(db);
        }

        // Добавляем статус занятости для каждого места
        const now = new Date();
        const placesWithStatus = db.places.map(place => {
            const activeBooking = db.bookings.find(b => 
                b.placeId === place.id && 
                b.status === 'approved' &&
                new Date(b.startTime) <= now && 
                new Date(b.endTime) >= now
            );

            const pendingBooking = db.bookings.find(b => 
                b.placeId === place.id && 
                b.status === 'pending'
            );

            let status = 'free';
            let bookingInfo = null;

            if (activeBooking) {
                status = 'occupied';
                const user = db.users.find(u => u.id === activeBooking.userId);
                const timeRemaining = Math.max(0, new Date(activeBooking.endTime) - now);
                bookingInfo = {
                    bookingId: activeBooking.id,
                    username: user?.username || 'Unknown',
                    timeRemaining: timeRemaining,
                    catchAmount: activeBooking.catchAmount || 0
                };
            } else if (pendingBooking) {
                status = 'pending';
            }

            return {
                ...place,
                status,
                bookingInfo
            };
        });

        res.json(placesWithStatus);
    } catch (error) {
        console.error('Get places error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const place = db.places.find(p => p.id === id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        res.json(place);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlaceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const now = new Date();
        const activeBooking = db.bookings.find(b => 
            b.placeId === id && 
            b.status === 'approved' &&
            new Date(b.startTime) <= now && 
            new Date(b.endTime) >= now
        );

        if (!activeBooking) {
            return res.json({ status: 'free' });
        }

        const user = db.users.find(u => u.id === activeBooking.userId);
        const timeRemaining = Math.max(0, new Date(activeBooking.endTime) - now);

        res.json({
            status: 'occupied',
            bookingId: activeBooking.id,
            username: user?.username || 'Unknown',
            timeRemaining: timeRemaining,
            catchAmount: activeBooking.catchAmount || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};