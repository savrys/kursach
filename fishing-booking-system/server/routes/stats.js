const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/stats/fishing/top:
 *   get:
 *     summary: Получить топ рыбаков по улову
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Топ-10 рыбаков
 */
router.get('/fishing/top', statsController.getTopFishermen);

/**
 * @swagger
 * /api/stats/visits/top:
 *   get:
 *     summary: Получить топ посетителей по времени
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Топ-10 посетителей
 */
router.get('/visits/top', statsController.getTopVisitors);

/**
 * @swagger
 * /api/stats/visits/update:
 *   post:
 *     summary: Обновить время посещения
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hours]
 *             properties:
 *               hours:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Время обновлено
 */
router.post('/visits/update', statsController.updateVisitTime);

module.exports = router;