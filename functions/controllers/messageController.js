const { getDbConnection } = require('../config/database');

class MessageController {
  // Отправить личное сообщение (HTTP)
  static async sendMessage(req, res) {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Неверные данные' });
    }

    let connection;
    try {
      connection = await getDbConnection();

      // Проверяем, являются ли пользователи друзьями
      const [friendship] = await connection.execute(
        `SELECT status FROM friendships 
         WHERE ((user_id = ? AND friend_id = ?) 
             OR (user_id = ? AND friend_id = ?))
           AND status = 'accepted'`,
        [senderId, receiverId, receiverId, senderId]
      );

      if (friendship.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Вы можете отправлять сообщения только друзьям' 
        });
      }

      // Сохраняем сообщение
      const [result] = await connection.execute(
        'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [senderId, receiverId, content.trim()]
      );

      // Получаем созданное сообщение с данными отправителя
      const [messages] = await connection.execute(`
        SELECT 
          pm.*,
          u.login as sender_name,
          u.avatar as sender_avatar
        FROM private_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE pm.id = ?
      `, [result.insertId]);

      res.json({ 
        success: true, 
        message: 'Сообщение отправлено',
        message: messages[0]
      });

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить диалог с пользователем
  static async getDialog(req, res) {
    const { userId, friendId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();

      const [messages] = await connection.execute(`
        SELECT 
          pm.*,
          u.login as sender_name,
          u.avatar as sender_avatar,
          CASE 
            WHEN pm.sender_id = ? THEN 'outgoing'
            ELSE 'incoming'
          END as direction
        FROM private_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE (pm.sender_id = ? AND pm.receiver_id = ?)
           OR (pm.sender_id = ? AND pm.receiver_id = ?)
        ORDER BY pm.created_at ASC
      `, [userId, userId, friendId, friendId, userId]);

      // Помечаем входящие сообщения как прочитанные
      await connection.execute(
        'UPDATE private_messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
        [userId, friendId]
      );

      res.json({ success: true, messages });

    } catch (error) {
      console.error('Ошибка получения диалога:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить список диалогов
  static async getConversations(req, res) {
    const { userId } = req.params;

    let connection;
    try {
      connection = await getDbConnection();

      const [conversations] = await connection.execute(`
        SELECT 
          u.id as friend_id,
          u.login as friend_name,
          u.avatar as friend_avatar,
          pm.content as last_message,
          pm.created_at as last_message_time,
          pm.is_read,
          COUNT(CASE WHEN pm.is_read = FALSE AND pm.receiver_id = ? THEN 1 END) as unread_count
        FROM users u
        INNER JOIN (
          SELECT 
            CASE 
              WHEN sender_id = ? THEN receiver_id
              ELSE sender_id
            END as friend_id,
            MAX(created_at) as max_time
          FROM private_messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY CASE 
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END
        ) last_msgs ON u.id = last_msgs.friend_id
        INNER JOIN private_messages pm ON (
          (pm.sender_id = ? AND pm.receiver_id = u.id) OR 
          (pm.sender_id = u.id AND pm.receiver_id = ?)
        ) AND pm.created_at = last_msgs.max_time
        WHERE u.id != ?
        ORDER BY pm.created_at DESC
      `, [userId, userId, userId, userId, userId, userId, userId, userId]);

      res.json({ success: true, conversations });

    } catch (error) {
      console.error('Ошибка получения диалогов:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  static async getUnreadCount(req, res) {
    const { userId } = req.params;
    
    let connection;
    try {
        connection = await getDbConnection();
        
        const [result] = await connection.execute(
            `SELECT COUNT(*) as count 
             FROM private_messages 
             WHERE receiver_id = ? AND is_read = FALSE`,
            [userId]
        );
        
        res.json({ 
            success: true, 
            count: result[0].count 
        });
        
    } catch (error) {
        console.error('Ошибка получения количества непрочитанных:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
        if (connection) await connection.end();
    }
}

}

module.exports = MessageController;