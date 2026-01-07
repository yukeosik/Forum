const { getDbConnection } = require('../config/database');

class SocketService {
    static async getUnreadCount(userId) {
        const connection = await getDbConnection();
        try {
            const [result] = await connection.execute(
                `SELECT COUNT(*) as count 
                FROM private_messages 
                WHERE receiver_id = ? AND is_read = FALSE`,
                [userId]
            );
            return result[0].count || 0;
        } finally {
            if (connection) await connection.end();
        }
    }
    // Обработка отправки сообщения через WebSocket
    static async handleSendMessage(io, socket, data, onlineUsers) {
        console.log('📤 Сообщение через WebSocket:', data);
        
        const { senderId, receiverId, content } = data;
        const connection = await getDbConnection();
        
        try {
            // Проверяем, являются ли пользователи друзьями
            const [friendship] = await connection.execute(
                `SELECT status FROM friendships 
                 WHERE ((user_id = ? AND friend_id = ?) 
                     OR (user_id = ? AND friend_id = ?))
                   AND status = 'accepted'`,
                [senderId, receiverId, receiverId, senderId]
            );

            if (friendship.length === 0) {
                socket.emit('messageError', { 
                    error: 'Вы можете отправлять сообщения только друзьям' 
                });
                return;
            }

            // Сохраняем в БД
            const [result] = await connection.execute(
                'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
                [senderId, receiverId, content]
            );

            // Получаем данные сообщения
            const [messages] = await connection.execute(`
                SELECT 
                    pm.*, 
                    u.login as sender_name, 
                    u.avatar as sender_avatar,
                    ur.login as receiver_name,
                    ur.avatar as receiver_avatar
                FROM private_messages pm
                JOIN users u ON pm.sender_id = u.id
                JOIN users ur ON pm.receiver_id = ur.id
                WHERE pm.id = ?
            `, [result.insertId]);

            const message = messages[0];

            const messageData = {
                id: message.id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                content: message.content,
                created_at: message.created_at,
                is_read: message.is_read,
                sender: {
                    id: message.sender_id,
                    name: message.sender_name,
                    avatar: message.sender_avatar
                },
                receiver: {
                    id: message.receiver_id,
                    name: message.receiver_name,
                    avatar: message.receiver_avatar
                }
            };
            
            // Отправляем отправителю
            const senderSocketId = onlineUsers.get(senderId.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit('newMessage', {
                    ...messageData,
                    direction: 'outgoing'
                });
                console.log(`📨 Сообщение отправлено обратно отправителю ${senderId}`);
            }

            const receiverSocketId = onlineUsers.get(receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newMessage', {
                    ...messageData,
                    direction: 'incoming'
                });
                console.log(`📨 Сообщение доставлено получателю ${receiverId}`);
            }

            await this.updateUnreadCounts(io, onlineUsers, senderId, receiverId);
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
            socket.emit('messageError', { error: 'Ошибка сервера', details: error.message });
        } finally {
            if (connection) await connection.end();
        }
    }

    static async updateUnreadCounts(io, onlineUsers, userId1, userId2) {
        console.log('🔄 Обновление счетчиков для пользователей:', userId1, userId2);
        
        // Для пользователя 1
        const count1 = await this.getUnreadCount(userId1);
        const socketId1 = onlineUsers.get(userId1.toString());
        if (socketId1) {
            io.to(socketId1).emit('unreadCountUpdate', { count: count1 });
            console.log(`📊 Отправлен счетчик ${count1} для пользователя ${userId1}`);
        }

        // Для пользователя 2
        const count2 = await this.getUnreadCount(userId2);
        const socketId2 = onlineUsers.get(userId2.toString());
        if (socketId2) {
            io.to(socketId2).emit('unreadCountUpdate', { count: count2 });
            console.log(`📊 Отправлен счетчик ${count2} для пользователя ${userId2}`);
        }
    }

    static async markMessageAsRead(io, socket, data, onlineUsers) {
        const { userId, messageId } = data;
        const connection = await getDbConnection();
        
        try {
            await connection.execute(
                'UPDATE private_messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
                [messageId, userId]
            );
            
            // Отправляем обновленное количество непрочитанных
            const unreadCount = await this.getUnreadCount(userId);
            const socketId = onlineUsers.get(userId.toString());
            if (socketId) {
                io.to(socketId).emit('unreadCountUpdate', {
                    count: unreadCount
                });
            }
            
        } finally {
            if (connection) await connection.end();
        }
    }

    // Обновление списков диалогов для пользователей
    static updateConversations(io, onlineUsers, userId1, userId2) {
        const socketId1 = onlineUsers.get(userId1.toString());
        const socketId2 = onlineUsers.get(userId2.toString());
        
        if (socketId1) io.to(socketId1).emit('updateConversations');
        if (socketId2) io.to(socketId2).emit('updateConversations');
    }

    // Получить статус пользователей (онлайн/офлайн)
    static getOnlineStatus(userIds) {
        const status = {};
        userIds.forEach(userId => {
            status[userId] = onlineUsers.has(userId.toString());
        });
        return status;
    }

    // Отправить уведомление пользователю
    static sendNotification(io, onlineUsers, userId, notification) {
        const socketId = onlineUsers.get(userId.toString());
        if (socketId) {
            io.to(socketId).emit('notification', notification);
        }
    }
}

module.exports = SocketService;