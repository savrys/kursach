const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authMiddleware);

// Коллекция
router.get('/', bookingController.getAllBookings);

router.post('/', [
    body('placeId').notEmpty().withMessage('Выберите место'),
    body('startTime').isISO8601().withMessage('Неверный формат даты'),
    body('duration').isInt({ min: 1, max: 24 }).withMessage('Длительность от 1 до 24 часов')
], validate, bookingController.createBooking);

// Мои брони
router.get('/me', bookingController.getMyBookings);

// Конкретная бронь
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.cancelBooking);

// Действия
router.post('/:id/extend', [
    body('additionalHours').isInt({ min: 1, max: 24 }).withMessage('Длительность от 1 до 24 часов')
], validate, bookingController.extendBooking);

router.post('/:id/request-cancel', bookingController.requestCancel);

module.exports = router;