const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/map/places:
 *   get:
 *     summary: Получить все места с текущим статусом
 *     tags: [Map]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список мест со статусами и информацией о бронях
 */
router.get('/places', mapController.getAllPlaces);

/**
 * @swagger
 * /api/map/places/{id}:
 *   get:
 *     summary: Получить место по ID
 *     tags: [Map]
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
 *         description: Данные места
 *       404:
 *         description: Место не найдено
 */
router.get('/places/:id', mapController.getPlaceById);

/**
 * @swagger
 * /api/map/places/{id}/status:
 *   get:
 *     summary: Получить статус конкретного места
 *     tags: [Map]
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
 *         description: Статус места (free/occupied/pending)
 */
router.get('/places/:id/status', mapController.getPlaceStatus);

module.exports = router;