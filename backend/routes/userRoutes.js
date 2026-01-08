const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить профиль текущего пользователя
router.get('/profile', UserController.getProfile);

// Загрузить аватар
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), UserController.uploadAvatar);

// Удалить аватар
router.post('/remove-avatar', authenticateToken, UserController.removeAvatar);

module.exports = router;