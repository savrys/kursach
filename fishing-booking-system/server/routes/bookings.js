const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authMiddleware);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Получить все бронирования
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список бронирований
 */
router.get('/', bookingController.getAllBookings);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Создать новое бронирование
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [placeId, startTime, duration]
 *             properties:
 *               placeId:
 *                 type: string
 *                 example: "1"
 *               startTime:
 *                 type: string
 *                 example: "2026-05-10T10:00"
 *               duration:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Бронь создана
 *       400:
 *         description: Место уже занято
 */
router.post('/', [
    body('placeId').notEmpty().withMessage('Выберите место'),
    body('startTime').isISO8601().withMessage('Неверный формат даты'),
    body('duration').isInt({ min: 1, max: 24 }).withMessage('Длительность от 1 до 24 часов')
], validate, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Получить мои бронирования
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список моих броней
 */
router.get('/me', bookingController.getMyBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Обновить бронирование
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Бронь обновлена
 */
router.put('/:id', bookingController.updateBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Отменить бронирование
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Бронь отменена
 */
router.delete('/:id', bookingController.cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/extend:
 *   post:
 *     summary: Продлить бронирование
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [additionalHours]
 *             properties:
 *               additionalHours:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Бронь продлена
 */
router.post('/:id/extend', [
    body('additionalHours').isInt({ min: 1, max: 24 }).withMessage('Длительность от 1 до 24 часов')
], validate, bookingController.extendBooking);

/**
 * @swagger
 * /api/bookings/{id}/request-cancel:
 *   post:
 *     summary: Запросить отмену брони
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Запрос отправлен
 */
router.post('/:id/request-cancel', bookingController.requestCancel);

module.exports = router;