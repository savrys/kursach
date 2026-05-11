const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authMiddleware);
router.use(roleCheck(['manager', 'admin']));

/**
 * @swagger
 * /api/manager/pending-bookings:
 *   get:
 *     summary: Получить заявки на бронирование и запросы на отмену
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список заявок
 */
router.get('/pending-bookings', managerController.getPendingBookings);

/**
 * @swagger
 * /api/manager/active-users:
 *   get:
 *     summary: Получить активных пользователей (сейчас на базе)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список активных пользователей
 */
router.get('/active-users', managerController.getActiveUsers);

/**
 * @swagger
 * /api/manager/bookings/{id}/approve:
 *   put:
 *     summary: Подтвердить бронирование
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Бронь подтверждена }
 */
router.put('/bookings/:id/approve', managerController.approveBooking);

/**
 * @swagger
 * /api/manager/bookings/{id}/reject:
 *   put:
 *     summary: Отклонить бронирование
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Бронь отклонена }
 */
router.put('/bookings/:id/reject', managerController.rejectBooking);

/**
 * @swagger
 * /api/manager/bookings/{id}/approve-cancel:
 *   put:
 *     summary: Одобрить запрос на отмену
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Отмена одобрена }
 */
router.put('/bookings/:id/approve-cancel', managerController.approveCancelRequest);

/**
 * @swagger
 * /api/manager/bookings/{id}/reject-cancel:
 *   put:
 *     summary: Отклонить запрос на отмену
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Запрос отклонён }
 */
router.put('/bookings/:id/reject-cancel', managerController.rejectCancelRequest);

/**
 * @swagger
 * /api/manager/places:
 *   post:
 *     summary: Создать новое место
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Место #6" }
 *               coordinates: { type: object, properties: { x: { type: integer }, y: { type: integer } } }
 *               description: { type: string }
 *               maxCapacity: { type: integer, example: 3 }
 *     responses:
 *       201: { description: Место создано }
 */
router.post('/places', managerController.createPlace);

/**
 * @swagger
 * /api/manager/places/{id}:
 *   put:
 *     summary: Обновить место
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Место обновлено }
 *   delete:
 *     summary: Удалить место
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Место удалено }
 */
router.put('/places/:id', managerController.updatePlace);
router.delete('/places/:id', managerController.deletePlace);

/**
 * @swagger
 * /api/manager/catches:
 *   post:
 *     summary: Добавить улов
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               bookingId: { type: string }
 *               amount: { type: number, example: 2.5 }
 *     responses:
 *       200: { description: Улов добавлен }
 */
router.post('/catches', managerController.addCatch);

/**
 * @swagger
 * /api/manager/stats/fishing:
 *   delete:
 *     summary: Очистить статистику улова
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Статистика очищена }
 */
router.delete('/stats/fishing', managerController.clearFishingStats);

/**
 * @swagger
 * /api/manager/stats/visits:
 *   delete:
 *     summary: Очистить статистику посещений
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Статистика очищена }
 */
router.delete('/stats/visits', managerController.clearVisitsStats);

/**
 * @swagger
 * /api/manager/places/{id}/image:
 *   post:
 *     summary: Загрузить фото места
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Фото загружено }
 *   delete:
 *     summary: Удалить фото места
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Фото удалено }
 */
router.post('/places/:id/image', managerController.uploadPlaceImage);
router.delete('/places/:id/image', managerController.deletePlaceImage);

/**
 * @swagger
 * /api/manager/map-image:
 *   post:
 *     summary: Загрузить карту местности
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Карта загружена }
 *   delete:
 *     summary: Удалить карту (сбросить на стандартную)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Карта удалена }
 */
router.post('/map-image', managerController.uploadMapImage);
router.delete('/map-image', managerController.deleteMapImage);

/**
 * @swagger
 * /api/manager/info:
 *   put:
 *     summary: Обновить информацию о базе отдыха
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               left: { type: string }
 *               right: { type: string }
 *     responses:
 *       200: { description: Информация обновлена }
 */
router.put('/info', settingsController.updateInfo);

module.exports = router;