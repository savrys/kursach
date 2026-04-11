exports.getPendingBookings = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        const pendingBookings = db.bookings.filter(b => b.status === 'pending');
        
        const bookingsWithDetails = pendingBookings.map(booking => {
            const user = db.users.find(u => u.id === booking.userId);
            const place = db.places.find(p => p.id === booking.placeId);
            
            return {
                ...booking,
                username: user?.username || 'Unknown',
                placeName: place?.name || 'Unknown'
            };
        });
        
        res.json(bookingsWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// НОВАЯ ФУНКЦИЯ - получить активных пользователей
exports.getActiveUsers = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        const now = new Date();
        
        // Находим активные бронирования
        const activeBookings = db.bookings.filter(b => 
            b.status === 'approved' &&
            new Date(b.startTime) <= now &&
            new Date(b.endTime) >= now
        );
        
        // Получаем уникальных пользователей из активных бронирований
        const activeUserIds = [...new Set(activeBookings.map(b => b.userId))];
        const activeUsers = db.users.filter(u => activeUserIds.includes(u.id));
        
        // Возвращаем только нужные поля
        const usersData = activeUsers.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role
        }));
        
        res.json(usersData);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.approveBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Проверяем, нет ли активных бронирований на этом месте
        const conflictingBooking = db.bookings.find(b => 
            b.placeId === booking.placeId && 
            b.status === 'approved' &&
            b.id !== id &&
            ((new Date(booking.startTime) >= new Date(b.startTime) && new Date(booking.startTime) < new Date(b.endTime)) ||
             (new Date(booking.endTime) > new Date(b.startTime) && new Date(booking.endTime) <= new Date(b.endTime)) ||
             (new Date(booking.startTime) <= new Date(b.startTime) && new Date(booking.endTime) >= new Date(b.endTime)))
        );

        if (conflictingBooking) {
            return res.status(400).json({ 
                message: 'Место уже забронировано на это время' 
            });
        }

        booking.status = 'approved';
        booking.approvedAt = new Date().toISOString();
        booking.approvedBy = req.user.id;
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error approving booking' });
        }

        res.json({ 
            message: 'Booking approved successfully',
            booking: booking
        });
    } catch (error) {
        console.error('Approve booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'rejected';
        booking.rejectedAt = new Date().toISOString();
        booking.rejectedBy = req.user.id;
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error rejecting booking' });
        }

        res.json({ message: 'Booking rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Одобрить запрос на отмену
exports.approveCancelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date().toISOString();
        booking.cancelledBy = req.user.id;
        booking.cancelRequested = false;
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error cancelling booking' });
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Отклонить запрос на отмену
exports.rejectCancelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.cancelRequested = false;
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error rejecting cancel request' });
        }

        res.json({ message: 'Cancel request rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createPlace = async (req, res) => {
    try {
        const { name, coordinates, description, maxCapacity } = req.body;
        const db = req.app.locals.readDB();
        
        const newPlace = {
            id: Date.now().toString(),
            name,
            coordinates,
            description,
            maxCapacity,
            createdAt: new Date().toISOString()
        };

        db.places.push(newPlace);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error creating place' });
        }

        res.status(201).json(newPlace);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePlace = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = req.app.locals.readDB();
        
        const place = db.places.find(p => p.id === id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        Object.assign(place, updates);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error updating place' });
        }

        res.json(place);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePlace = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.readDB();
        
        const placeIndex = db.places.findIndex(p => p.id === id);
        if (placeIndex === -1) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Проверяем активные бронирования
        const activeBookings = db.bookings.filter(b => 
            b.placeId === id && b.status === 'approved'
        );
        
        if (activeBookings.length > 0) {
            return res.status(400).json({ message: 'Cannot delete place with active bookings' });
        }

        db.places.splice(placeIndex, 1);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error deleting place' });
        }

        res.json({ message: 'Place deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addCatch = async (req, res) => {
    try {
        const { userId, bookingId, amount } = req.body;
        const db = req.app.locals.readDB();
        
        const booking = db.bookings.find(b => b.id === bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Обновляем улов в бронировании
        booking.catchAmount = (booking.catchAmount || 0) + amount;
        
        // Обновляем статистику рыбалки
        const existingStat = db.stats.fishing.find(s => s.userId === userId);
        if (existingStat) {
            existingStat.totalCatch += amount;
        } else {
            const user = db.users.find(u => u.id === userId);
            db.stats.fishing.push({
                userId,
                username: user?.username || 'Unknown',
                totalCatch: amount
            });
        }
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error adding catch' });
        }

        res.json({ 
            message: 'Catch added successfully',
            bookingCatch: booking.catchAmount,
            totalCatch: db.stats.fishing.find(s => s.userId === userId)?.totalCatch
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.clearFishingStats = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        db.stats.fishing = [];
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error clearing fishing stats' });
        }

        res.json({ message: 'Fishing statistics cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.clearVisitsStats = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        db.stats.visits = [];
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error clearing visits stats' });
        }

        res.json({ message: 'Visits statistics cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};