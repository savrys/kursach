const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Получить профиль пользователя
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль, брони и статистика
 *   put:
 *     summary: Обновить профиль
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Профиль обновлён
 */
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /api/user/booking-requests:
 *   post:
 *     summary: Создать заявку на бронирование
 *     tags: [User]
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
 *               placeId: { type: string }
 *               startTime: { type: string, example: "2026-05-10T10:00" }
 *               duration: { type: integer, example: 2 }
 *     responses:
 *       201:
 *         description: Заявка создана
 */
router.post('/booking-requests', userController.createBookingRequest);

module.exports = router;