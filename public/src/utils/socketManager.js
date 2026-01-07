// src/utils/socketManager.js
import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.isInitialized = false;
  }

  // Инициализация подключения
  connect(userId) {
    if (this.socket?.connected && this.currentUserId === userId) {
      console.log('✅ SocketManager: Уже подключен для пользователя', userId);
      return this.socket;
    }

    // Закрываем старое подключение
    if (this.socket) {
      console.log('🔌 SocketManager: Закрываем старое подключение');
      this.socket.disconnect();
    }

    console.log('🔌 SocketManager: Создаем подключение для', userId);
    this.currentUserId = userId;

    // Подключаемся к серверу
    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      path: '/socket.io/',
      autoConnect: true
    });

    this.setupEventHandlers();
    
    // Пытаемся подключиться
    this.socket.connect();
    
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Подключение успешно
    this.socket.on('connect', () => {
      console.log('✅ SocketManager: Подключен к серверу, ID:', this.socket.id);
      
      // Регистрируем пользователя
      if (this.currentUserId) {
        console.log('📝 SocketManager: Регистрируем пользователя', this.currentUserId);
        this.socket.emit('register', this.currentUserId);
      }
    });

    // Подтверждение регистрации
    this.socket.on('registered', (data) => {
      console.log('✅ SocketManager: Пользователь зарегистрирован', data);
    });

    // Обновление счетчика непрочитанных
    this.socket.on('unreadCountUpdate', (data) => {
      console.log('📊 SocketManager: Получен счетчик непрочитанных:', data.count);
      
      // Отправляем глобальное событие
      window.dispatchEvent(new CustomEvent('unreadCountChanged', {
        detail: { 
          count: data.count,
          userId: data.userId || this.currentUserId
        }
      }));
    });

    // Новое сообщение
    this.socket.on('newMessage', (message) => {
      console.log('📨 SocketManager: Получено новое сообщение:', message.id);
      
      // Отправляем глобальное событие
      window.dispatchEvent(new CustomEvent('newMessageReceived', {
        detail: { message }
      }));
    });

    // Обновление диалогов
    this.socket.on('updateConversations', () => {
      console.log('🔄 SocketManager: Обновление диалогов');
      window.dispatchEvent(new Event('conversationsUpdated'));
    });

    // Ошибки
    this.socket.on('connect_error', (error) => {
      console.error('❌ SocketManager: Ошибка подключения:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 SocketManager: Отключен от сервера:', reason);
    });

    this.isInitialized = true;
  }

  // Отправить сообщение
  sendMessage(data) {
    if (this.isConnected()) {
      console.log('📤 SocketManager: Отправка сообщения', data);
      this.socket.emit('sendMessage', data);
      return true;
    }
    console.warn('⚠️ SocketManager: Не могу отправить, WebSocket не подключен');
    return false;
  }

  // Отправить событие прочтения
  markMessageRead(data) {
    if (this.isConnected()) {
      this.socket.emit('markMessageRead', data);
      return true;
    }
    return false;
  }

  // Проверить подключение
  isConnected() {
    return this.socket?.connected || false;
  }

  // Получить текущий socket
  getSocket() {
    return this.socket;
  }

  // Отключиться
  disconnect() {
    if (this.socket) {
      console.log('🔌 SocketManager: Отключаем WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      this.isInitialized = false;
    }
  }
}

// Экспортируем singleton
export const socketManager = new SocketManager();