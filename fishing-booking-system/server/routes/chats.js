const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', chatController.getUserChats);
router.post('/', chatController.createChat);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.delete('/:chatId', chatController.deleteChat);
router.put('/messages/:messageId/read', chatController.markAsRead);
бю
module.exports = router;