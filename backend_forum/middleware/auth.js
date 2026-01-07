const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔐 Проверка токена...');
    console.log('Заголовок Authorization:', authHeader ? 'есть' : 'нет');
    console.log('Токен:', token ? 'получен' : 'нет');
    
    if (!token) {
      console.log('❌ Токен не предоставлен');
      return res.status(401).json({ 
        success: false, 
        message: 'Требуется авторизация' 
      });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('❌ Ошибка проверки токена:', err.message);
        return res.status(403).json({ 
          success: false, 
          message: 'Неверный токен' 
        });
      }
      
      console.log('✅ Токен действителен, пользователь ID:', user.userId);
      req.user = user;
      next();
    });
    
  } catch (error) {
    console.error('❌ Ошибка в middleware:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
}

module.exports = {
  authenticateToken
};