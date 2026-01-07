const UploadService = require('../services/uploadService');
const { getDbConnection } = require('../config/database');
const fs = require('fs');

class UserController {
  // Получить профиль пользователя
  static async getProfile(req, res) {
    let connection;
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Не авторизован' 
        });
      }

      console.log('🔄 Запрос профиля для ID:', userId);

      connection = await getDbConnection();

      const [users] = await connection.execute(
        'SELECT id, login, email, avatar, created_at FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Пользователь не найден' });
      }
      
      res.json({ success: true, user: users[0] });
      
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }
  

  static async uploadAvatar(req, res) {
    let connection;
    try {
      // Проверяем аутентификацию через JWT middleware
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Не авторизован' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Файл не загружен' });
      }

      console.log('📤 Загрузка аватара для пользователя ID:', userId);
      console.log('📁 Файл:', req.file.originalname, 'Размер:', req.file.size);

      // Валидация файла
      UploadService.validateFileType(req.file.mimetype);
      UploadService.validateFileSize(req.file.size);

      // Удаляем старый аватар
      await UploadService.deleteOldAvatar(userId);

      // Сохраняем информацию в БД
      const avatarUrl = await UploadService.saveAvatarInfo(userId, req.file.filename);

      res.json({ 
        success: true, 
        message: 'Аватар успешно загружен', 
        avatarUrl: avatarUrl 
      });

    } catch (error) {
      console.error('❌ Ошибка загрузки аватара:', error);
      
      // Удаляем загруженный файл в случае ошибки
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Ошибка загрузки аватара' 
      });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Удалить аватар (требует аутентификации)
  static async removeAvatar(req, res) {
    let connection;
    try {
      // Проверяем аутентификацию через JWT middleware
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Не авторизован' });
      }

      console.log('🗑️ Удаление аватара для пользователя ID:', userId);

      await UploadService.removeAvatar(userId);

      res.json({ 
        success: true, 
        message: 'Аватар удален'
      });

    } catch (error) {
      console.error('❌ Ошибка удаления аватара:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Ошибка удаления аватара' 
      });
    } finally {
      if (connection) await connection.end();
    }
  }
}

module.exports = UserController;