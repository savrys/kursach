exports.getAllBookings = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        res.json(db.bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { placeId, startTime, duration } = req.body;
        const userId = req.user.id;
        const db = req.app.locals.readDB();

        // Проверка места
        const place = db.places.find(p => p.id === placeId);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Вычисляем время окончания на основе длительности
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 3600000); // duration в часах

        // Проверка на пересечение бронирований
        const conflictingBooking = db.bookings.find(b => 
            b.placeId === placeId && 
            b.status === 'approved' &&
            ((start >= new Date(b.startTime) && start < new Date(b.endTime)) ||
             (end > new Date(b.startTime) && end <= new Date(b.endTime)) ||
             (start <= new Date(b.startTime) && end >= new Date(b.endTime)))
        );

        if (conflictingBooking) {
            return res.status(400).json({ message: 'Place is already booked for this time' });
        }

        const newBooking = {
            id: Date.now().toString(),
            userId,
            placeId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            extendedCount: 0,
            catchAmount: 0
        };

        db.bookings.push(newBooking);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error saving booking' });
        }

        // Обновляем время посещения
        const visitDuration = duration;
        const existingVisit = db.stats.visits.find(v => v.userId === userId);
        
        if (existingVisit) {
            existingVisit.totalHours += visitDuration;
        } else {
            db.stats.visits.push({
                userId,
                username: req.user.username,
                totalHours: visitDuration
            });
        }
        
        req.app.locals.writeDB(db);

        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = req.app.locals.readDB();
        
        const bookingIndex = db.bookings.findIndex(b => b.id === id);
        if (bookingIndex === -1) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Проверка прав
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
            db.bookings[bookingIndex].userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        db.bookings[bookingIndex] = { ...db.bookings[bookingIndex], ...updates };
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error updating booking' });
        }

        res.json(db.bookings[bookingIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Проверка прав
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
            booking.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date().toISOString();
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error cancelling booking' });
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.extendBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { additionalHours } = req.body;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Только менеджер или админ может продлить
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const newEndTime = new Date(booking.endTime);
        newEndTime.setHours(newEndTime.getHours() + additionalHours);
        
        booking.endTime = newEndTime.toISOString();
        booking.extendedCount = (booking.extendedCount || 0) + 1;
        
        // Обновляем время посещения
        const visitDuration = additionalHours;
        const visitStat = db.stats.visits.find(v => v.userId === booking.userId);
        if (visitStat) {
            visitStat.totalHours += visitDuration;
        }
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error extending booking' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.readDB();
        
        const myBookings = db.bookings.filter(b => b.userId === userId);
        res.json(myBookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requestCancel = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Проверка прав
        if (booking.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        booking.cancelRequested = true;
        booking.cancelRequestedAt = new Date().toISOString();
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error requesting cancel' });
        }

        res.json({ message: 'Cancel request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};