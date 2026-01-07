const express = require('express');
const router = express.Router();
const FriendController = require('../controllers/friendController');
const { authenticateToken } = require('../middleware/auth');
const { validateId } = require('../utils/validators');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить информацию о пользователе
router.get('/users/:userId', (req, res, next) => {
    if (!validateId(req.params.userId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректный ID пользователя' 
        });
    }
    next();
}, FriendController.getUserInfo);

// Получить сообщения пользователя
router.get('/users/:userId/posts', FriendController.getUserPosts);

// Получить темы пользователя
router.get('/users/:userId/topics', FriendController.getUserTopics);

// Отправить запрос в друзья
router.post('/request', (req, res, next) => {
    if (!validateId(req.body.userId) || !validateId(req.body.friendId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректные ID пользователей' 
        });
    }
    next();
}, FriendController.sendFriendRequest);

// Принять/отклонить запрос в друзья
router.post('/respond', (req, res, next) => {
    if (!validateId(req.body.userId) || !validateId(req.body.friendId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректные ID пользователей' 
        });
    }
    if (!['accept', 'reject'].includes(req.body.action)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректное действие. Допустимо: accept или reject' 
        });
    }
    next();
}, FriendController.respondToFriendRequest);

// Получить список друзей
router.get('/:userId', (req, res, next) => {
    if (!validateId(req.params.userId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректный ID пользователя' 
        });
    }
    next();
}, FriendController.getFriends);

// Получить входящие запросы на дружбу
router.get('/requests/:userId', (req, res, next) => {
    if (!validateId(req.params.userId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректный ID пользователя' 
        });
    }
    next();
}, FriendController.getFriendRequests);

module.exports = router;