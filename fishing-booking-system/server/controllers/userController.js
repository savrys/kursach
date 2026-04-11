exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = req.app.locals.readDB();
        
        const user = db.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userBookings = db.bookings.filter(b => b.userId === userId);
        const userStats = {
            fishing: db.stats.fishing.find(s => s.userId === userId) || { totalCatch: 0 },
            visits: db.stats.visits.find(v => v.userId === userId) || { totalHours: 0 }
        };

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
            bookings: userBookings,
            stats: userStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;
        const db = req.app.locals.readDB();
        
        const user = db.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error updating profile' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createBookingRequest = async (req, res) => {
    try {
        const { placeId, startTime, endTime } = req.body;
        const userId = req.user.id;
        const db = req.app.locals.readDB();

        const newBooking = {
            id: Date.now().toString(),
            userId,
            placeId,
            startTime,
            endTime,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        db.bookings.push(newBooking);
        
        if (!req.app.locals.writeDB(db)) {
            return res.status(500).json({ message: 'Error creating booking request' });
        }

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};