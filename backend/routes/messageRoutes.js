const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validateMessageContent } = require('../utils/validators');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Отправить сообщение (HTTP)
router.post('/send', (req, res, next) => {
    if (!validateId(req.body.senderId) || !validateId(req.body.receiverId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректные ID пользователей' 
        });
    }
    
    const contentValidation = validateMessageContent(req.body.content);
    if (!contentValidation.isValid) {
        return res.status(400).json({ 
            success: false, 
            message: contentValidation.message 
        });
    }
    next();
}, MessageController.sendMessage);

// Получить диалог
router.get('/dialog/:userId/:friendId', (req, res, next) => {
    if (!validateId(req.params.userId) || !validateId(req.params.friendId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректные ID пользователей' 
        });
    }
    next();
}, MessageController.getDialog);

// Получить список диалогов
router.get('/conversations/:userId', (req, res, next) => {
    if (!validateId(req.params.userId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректный ID пользователя' 
        });
    }
    next();
}, MessageController.getConversations);

router.get('/unread-count/:userId', MessageController.getUnreadCount);

router.get('/messages/unread-count/:userId', MessageController.getUnreadCount);

module.exports = router;