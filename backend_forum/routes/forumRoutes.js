const express = require('express');
const router = express.Router();
const ForumController = require('../controllers/forumController');
const { validateTopicTitle, validateMessageContent, validateId } = require('../utils/validators');

// Категории
router.get('/categories', ForumController.getCategories);
router.get('/categories/:categoryId', ForumController.getCategoryById);
router.get('/categories/:categoryId/topics', ForumController.getCategoryTopics);

// Темы
router.post('/topics', (req, res, next) => {
    if (!validateTopicTitle(req.body.title).isValid) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректный заголовок темы' 
        });
    }
    if (!validateMessageContent(req.body.content).isValid) {
        return res.status(400).json({ 
            success: false, 
            message: 'Некорректное содержание темы' 
        });
    }
    next();
}, ForumController.createTopic);

router.get('/topics/:topicId', ForumController.getTopicById);
router.put('/topics/:topicId', ForumController.editTopic);

// Сообщения в темах
router.post('/topics/:topicId/posts', (req, res, next) => {
    if (!validateMessageContent(req.body.content).isValid) {
        return res.status(400).json({ 
            success: false, 
            message: 'Сообщение не может быть пустым' 
        });
    }
    next();
}, ForumController.addPostToTopic);

// Реакции
router.get('/posts/:postId/reactions', ForumController.getPostReactions);
router.post('/posts/:postId/reactions', ForumController.handlePostReaction);

module.exports = router;