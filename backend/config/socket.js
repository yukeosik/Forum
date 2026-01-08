// config/socket.js
const SocketService = require('../services/SocketService');

module.exports.setupSocket = (io) => {
    const onlineUsers = new Map();
    
    io.on('connection', (socket) => {
        console.log('🔌 Сервер: Новое подключение:', socket.id);
        
        // Регистрация пользователя
        socket.on('register', (userId) => {
            console.log(`✅ Сервер: Регистрация пользователя ${userId}`);
            onlineUsers.set(userId.toString(), socket.id);
            
            // Отправляем начальное количество непрочитанных
            SocketService.getUnreadCount(userId).then(count => {
                console.log(`📊 Сервер: Отправка счетчика ${count} пользователю ${userId}`);
                socket.emit('unreadCountUpdate', { 
                    count: count,
                    userId: userId 
                });
            });
        });
        
        // Отправка сообщения
        socket.on('sendMessage', async (data) => {
            console.log('📤 Сервер: Получено сообщение:', data);
            await SocketService.handleSendMessage(io, socket, data, onlineUsers);
        });
        
        // Пометка сообщения как прочитанного
        socket.on('markMessageRead', async (data) => {
            console.log('✅ Сервер: Пометка сообщения как прочитанного:', data);
            await SocketService.markMessageAsRead(io, socket, data, onlineUsers);
        });
        
        // Отключение
        socket.on('disconnect', () => {
            console.log('🔌 Сервер: Пользователь отключился:', socket.id);
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`❌ Сервер: Удален пользователь ${userId}`);
                    break;
                }
            }
        });
    });
};