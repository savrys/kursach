const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Получить список чатов
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список чатов
 */
router.get('/', chatController.getUserChats);

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Создать новый чат
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Чат создан
 */
router.post('/', chatController.createChat);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Получить сообщения чата
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список сообщений
 */
router.get('/:chatId/messages', chatController.getMessages);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   post:
 *     summary: Отправить сообщение
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: Привет, можно продлить бронь?
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 */
router.post('/:chatId/messages', chatController.sendMessage);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   delete:
 *     summary: Удалить чат
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Чат удалён
 */
router.delete('/:chatId', chatController.deleteChat);

/**
 * @swagger
 * /api/chats/messages/{messageId}/read:
 *   put:
 *     summary: Отметить сообщение как прочитанное
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Сообщение отмечено
 */
router.put('/messages/:messageId/read', chatController.markAsRead);

module.exports = router;