const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', bookingController.getAllBookings);
router.post('/', bookingController.createBooking);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.cancelBooking);
router.post('/:id/extend', bookingController.extendBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.post('/:id/request-cancel', bookingController.requestCancel);

module.exports = router;