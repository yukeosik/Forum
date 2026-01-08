const { getDbConnection } = require('../config/database');

class FriendController {
  // Отправить запрос в друзья
  static async sendFriendRequest(req, res) {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ success: false, message: 'Неверные данные' });
    }

    if (userId === friendId) {
      return res.status(400).json({ success: false, message: 'Нельзя добавить себя в друзья' });
    }

    let connection;
    try {
      connection = await getDbConnection();

      // Проверяем, существует ли уже запрос
      const [existing] = await connection.execute(
        `SELECT * FROM friendships 
         WHERE (user_id = ? AND friend_id = ?) 
            OR (user_id = ? AND friend_id = ?)`,
        [userId, friendId, friendId, userId]
      );

      if (existing.length > 0) {
        const status = existing[0].status;
        if (status === 'pending') {
          return res.json({ success: false, message: 'Запрос уже отправлен' });
        } else if (status === 'accepted') {
          return res.json({ success: false, message: 'Вы уже друзья' });
        } else if (status === 'blocked') {
          return res.json({ success: false, message: 'Пользователь заблокировал вас' });
        }
      }

      // Создаем запрос на дружбу
      await connection.execute(
        'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
        [userId, friendId, 'pending']
      );

      res.json({ 
        success: true, 
        message: 'Запрос на дружбу отправлен' 
      });

    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Принять/отклонить запрос в друзья
  static async respondToFriendRequest(req, res) {
    const { userId, friendId, action } = req.body; // action: 'accept' или 'reject'

    if (!userId || !friendId || !action) {
      return res.status(400).json({ success: false, message: 'Неверные данные' });
    }

    let connection;
    try {
      connection = await getDbConnection();

      // Находим запрос
      const [requests] = await connection.execute(
        `SELECT * FROM friendships 
         WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
        [friendId, userId]
      );

      if (requests.length === 0) {
        return res.status(404).json({ success: false, message: 'Запрос не найден' });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      
      // Обновляем статус запроса
      await connection.execute(
        'UPDATE friendships SET status = ? WHERE id = ?',
        [newStatus, requests[0].id]
      );

      // Если приняли в друзья, создаем обратную связь
      if (action === 'accept') {
        await connection.execute(
          'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
          [userId, friendId, 'accepted']
        );
      }

      res.json({ 
        success: true, 
        message: action === 'accept' ? 'Пользователь добавлен в друзья' : 'Запрос отклонен' 
      });

    } catch (error) {
      console.error('Ошибка обработки запроса:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить список друзей
  static async getFriends(req, res) {
    const { userId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();

      const [friends] = await connection.execute(`
        SELECT 
          u.id,
          u.login,
          u.avatar,
          u.email,
          f.created_at as friendship_date
        FROM friendships f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ? AND f.status = 'accepted'
        ORDER BY f.updated_at DESC
      `, [userId]);

      res.json({ success: true, friends });

    } catch (error) {
      console.error('Ошибка получения друзей:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить входящие запросы на дружбу
  static async getFriendRequests(req, res) {
    const { userId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();

      const [requests] = await connection.execute(`
        SELECT 
          f.id as request_id,
          u.id as user_id,
          u.login,
          u.avatar,
          u.email,
          f.created_at
        FROM friendships f
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
        ORDER BY f.created_at DESC
      `, [userId]);

      res.json({ success: true, requests });

    } catch (error) {
      console.error('Ошибка получения запросов:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить информацию о пользователе
  static async getUserInfo(req, res) {
    const { userId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();
      
      const [users] = await connection.execute(
        `SELECT id, login, email, avatar, created_at 
         FROM users 
         WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Пользователь не найден' });
      }

      res.json({ success: true, user: users[0] });

    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить сообщения пользователя
  static async getUserPosts(req, res) {
    const { userId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();
      
      const [posts] = await connection.execute(
        `SELECT p.*, t.title as topic_title
         FROM posts p
         JOIN topics t ON p.topic_id = t.id
         WHERE p.author_id = ?
         ORDER BY p.created_at DESC
         LIMIT 20`,
        [userId]
      );

      res.json({ success: true, posts });

    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить темы пользователя
  static async getUserTopics(req, res) {
    const { userId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();
      
      const [topics] = await connection.execute(`
        SELECT 
          t.*,
          c.name as category_name,
          COUNT(p.id) as post_count
        FROM topics t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN posts p ON t.id = p.topic_id
        WHERE t.author_id = ?
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [userId]);

      res.json({ success: true, topics });

    } catch (error) {
      console.error('Ошибка получения тем:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }
}

module.exports = FriendController;