const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Коллекция бронирований
router.get('/', bookingController.getAllBookings);
router.post('/', bookingController.createBooking);

// Конкретное бронирование
router.get('/me', bookingController.getMyBookings);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.cancelBooking);

// Действия с бронированием
router.post('/:id/extend', bookingController.extendBooking);
router.post('/:id/cancel-request', bookingController.requestCancel);

module.exports = router;