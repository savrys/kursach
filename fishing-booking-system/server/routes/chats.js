const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Коллекция чатов
router.get('/', chatController.getUserChats);
router.post('/', chatController.createChat);

// Конкретный чат
router.delete('/:id', chatController.deleteChat);

// Сообщения в чате
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);

// Отметка о прочтении
router.put('/messages/:id/read', chatController.markAsRead);

module.exports = router;