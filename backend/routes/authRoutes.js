const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRegistrationData, validateLoginData } = require('../utils/validators');

// Регистрация
router.post('/register', (req, res, next) => {
    const validation = validateRegistrationData(req.body);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: validation.errors.join(', ')
        });
    }
    next();
}, AuthController.register);

// Вход
router.post('/login', (req, res, next) => {
    const validation = validateLoginData(req.body);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: validation.errors.join(', ')
        });
    }
    next();
}, AuthController.login);

// Подтверждение email
router.post('/verify', AuthController.verify);

// Повторная отправка кода подтверждения
router.post('/resend-verification', AuthController.resendVerification);

module.exports = router;