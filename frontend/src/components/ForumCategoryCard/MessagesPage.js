import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../../config/api';
import { socketManager } from '../../utils/socketManager';

const MessagesPage = () => {
  const { friendId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const receivedMessageIds = useRef(new Set());
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      navigate('/auth');
      return;
    }

    const user = JSON.parse(savedUser);
    console.log('👤 Текущий пользователь:', user.id);
    setCurrentUser(user);

    const socket = socketManager.connect(user.id);

    // ЗАГРУЗКА ДАННЫХ
    const loadData = async () => {
      try {
        if (friendId) {
          await fetchDialog(user.id, friendId);
          await fetchFriendInfo(friendId);
        }
        await fetchConversations(user.id);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleNewMessage = (event) => {
      const message = event.detail.message;
      console.log('📨 MessagesPage: Новое сообщение от менеджера:', message);

      // Проверка дублирования
      if (receivedMessageIds.current.has(message.id)) {
        return;
      }

      receivedMessageIds.current.add(message.id);

      // Определяем направление
      const isOutgoing = message.sender_id === user.id;
      const direction = isOutgoing ? 'outgoing' : 'incoming';

      // Проверяем, относится ли сообщение к текущему диалогу
      const isForCurrentDialog = friendId && (
        (parseInt(friendId) === message.sender_id) ||
        (parseInt(friendId) === message.receiver_id)
      );

      if (isForCurrentDialog) {
        console.log('✅ Добавляем сообщение в текущий диалог');
        
        setMessages(prev => {
          const exists = prev.find(m => m.id === message.id);
          if (!exists) {
            return [...prev, { ...message, direction }];
          }
          return prev;
        });
      }

      // Прокрутка
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    const handleConversationsUpdated = () => {
      console.log('🔄 MessagesPage: Обновление диалогов');
      fetchConversations(user.id);
    };

    // Подписываемся на события
    window.addEventListener('newMessageReceived', handleNewMessage);
    window.addEventListener('conversationsUpdated', handleConversationsUpdated);

    const markMessagesAsRead = () => {
      console.log('✅ MessagesPage: Пользователь зашел в диалог, отправляем событие прочтения');
      window.dispatchEvent(new Event('messagesRead'));
    };

    // Если есть friendId, отправляем событие прочтения
    if (friendId) {
      setTimeout(markMessagesAsRead, 1000);
    }

    return () => {
      window.removeEventListener('newMessageReceived', handleNewMessage);
      window.removeEventListener('conversationsUpdated', handleConversationsUpdated);
    };
  }, [friendId, navigate]);

  useEffect(() => {
    if (currentUser && friendId) {
      console.log('🔄 Загрузка диалога для нового друга:', friendId);
      fetchDialog(currentUser.id, friendId);
      fetchFriendInfo(friendId);
    }
  }, [friendId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDialog = useCallback(async (userId, friendId) => {

    try {
      const response = await fetch(API_ENDPOINTS.dialog(userId, friendId), {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        receivedMessageIds.current.clear();
        data.messages.forEach(msg => {
          receivedMessageIds.current.add(msg.id);
        });

        const messagesWithDirection = data.messages.map(msg => ({
          ...msg,
          direction: msg.sender_id === parseInt(userId) ? 'outgoing' : 'incoming'
        }));

        setMessages(messagesWithDirection);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Ошибка загрузки диалога:', error);
    }
  }, []);

  const fetchFriendInfo = async (friendId) => {
    try {
      const response = await fetch(API_ENDPOINTS.userInfo(friendId), {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) setFriend(data.user);
    } catch (error) {
      console.error('Ошибка загрузки информации о друге:', error);
    }
  };

  const fetchConversations = async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.conversations(userId), {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) setConversations(data.conversations);
    } catch (error) {
      console.error('Ошибка загрузки диалогов:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !friendId) {
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Используем socketManager для отправки
    if (socketManager.isConnected()) {
      console.log('📤 Отправка через socketManager:', messageContent);
      
      const success = socketManager.sendMessage({
        senderId: currentUser.id,
        receiverId: friendId,
        content: messageContent
      });

      if (!success) {
        // Добавляем сообщение локально для мгновенного отображения
        console.log('📤 WebSocket не подключен, отправка через HTTP');
        await sendMessageViaHTTP(messageContent);
      }
    } else {
      await sendMessageViaHTTP(messageContent);
    }
  };

  const sendMessageViaHTTP = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.sendMessage, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: friendId,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        // Перезагружаем диалог для получения сообщения с сервера
        fetchDialog(currentUser.id, friendId);
        fetchConversations(currentUser.id);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Ошибка отправки через HTTP:', error);
      alert('Ошибка отправки сообщения');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        <div>Загрузка сообщений...</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          WebSocket: {socketConnected ? '✅' : '⏳'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Список диалогов */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #ddd',
        background: '#f8f9fa',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
          <h2 style={{ margin: 0 }}>Сообщения</h2>
        </div>
        <div>
          {conversations.map(conv => (
            <div
              key={conv.friend_id}
              onClick={() => navigate(`/messages/${conv.friend_id}`)}
              style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                background: conv.friend_id === parseInt(friendId) ? '#e3f2fd' : 'white',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src={conv.friend_avatar || '/assets/images/poringAvatar.png'} 
                  alt="Аватар"
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <strong>{conv.friend_name}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ 
                    margin: '5px 0 0 0', 
                    fontSize: '14px', 
                    color: '#666',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conv.last_message}
                  </p>
                </div>
              </div>
              {conv.unread_count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  {conv.unread_count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Окно чата */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {friend ? (
          <>
            {/* Заголовок чата */}
            <div style={{ 
              padding: '15px 20px', 
              borderBottom: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <img 
                src={friend.avatar || '/assets/images/poringAvatar.png'} 
                alt="Аватар"
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
              <div>
                <h2 style={{ margin: 0 }}>{friend.login}</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {friend.email}
                </p>
              </div>
            </div>

            {/* Сообщения */}
            <div style={{ 
              flex: 1, 
              padding: '20px', 
              overflowY: 'auto',
              background: '#f5f5f5'
            }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.direction === 'outgoing' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 15px',
                    borderRadius: '18px',
                    background: msg.direction === 'outgoing' ? '#007bff' : 'white',
                    color: msg.direction === 'outgoing' ? 'white' : 'black',
                    border: msg.direction === 'incoming' ? '1px solid #ddd' : 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <div>{msg.content}</div>
                    <div style={{
                      fontSize: '11px',
                      textAlign: 'right',
                      marginTop: '5px',
                      opacity: 0.7
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === 'incoming' && !msg.is_read && ' • Не прочитано'}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма отправки */}
            <form onSubmit={sendMessage} style={{ padding: '20px', borderTop: '1px solid #ddd' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    fontSize: '16px'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '10px 20px',
                    background: newMessage.trim() ? '#007bff' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Отправить
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#666'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3>Выберите диалог</h3>
              <p>Начните общение с одного из ваших друзей</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;