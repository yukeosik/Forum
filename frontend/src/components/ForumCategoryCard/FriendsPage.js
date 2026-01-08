import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../../config/api';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Токе не найден в localstorage');
        navigate('/auth');
        return;
      }

      fetchFriends(user.id, token);
      fetchFriendRequests(user.id, token);
    } else {
      navigate('/auth');
    }
  }, []);

  const getAuthHeaders = (token) => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchFriends = async (userId, token) => {
    try {
      console.log('📤 Запрос друзей с токеном:', token ? 'есть' : 'нет');

      const response = await fetch(API_ENDPOINTS.friends(userId), {
        headers: getAuthHeaders(token)
      });

      const data = await response.json();
      console.log('Друзья:', data);

      if (data.success) {
        setFriends(data.friends);
      } else {
        console.error('Ошибка при получении друзей:', data.message);
      }
    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    }
  };

  const fetchFriendRequests = async (userId, token) => {
    try {
      console.log('📤 Запрос запросов в друзья с токеном:', token ? 'есть' : 'нет');

      const response = await fetch(API_ENDPOINTS.friendRequests(userId), {
        headers: getAuthHeaders(token)
      });

      const data = await response.json();
      console.log('Запросы:', data);

      if (data.success) {
        setRequests(data.requests);
      } else {
        console.error('Ошибка при получении запросов:', data.message);
      }
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    if (!currentUser || !token) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.sendFriendRequest, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          userId: currentUser.id,
          friendId
        })
      });
      
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
      alert('Ошибка отправки запроса');
    }
  };

  const respondToRequest = async (requestId, friendId, action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Требуется авторизация');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.respondFriendRequest, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          userId: currentUser.id,
          friendId,
          action
        })
      });
      
      const data = await response.json();
      alert(data.message);
      
      fetchFriends(currentUser.id, token);
      fetchFriendRequests(currentUser.id, token);
    } catch (error) {
      console.error('Ошибка обработки запроса:', error);
      alert('Ошибка обработки запроса');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Друзья и сообщения</h1>
      
      {/* Входящие запросы */}
      {requests.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>Входящие запросы в друзья ({requests.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requests.map(request => (
              <div 
                key={request.request_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img 
                    src={request.avatar || '/assets/images/poringAvatar.png'} 
                    alt="Аватар"
                    style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{request.login}</h3>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                      Отправлен: {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => respondToRequest(request.request_id, request.user_id, 'accept')}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => respondToRequest(request.request_id, request.user_id, 'reject')}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список друзей */}
      <div>
        <h2>Друзья ({friends.length})</h2>
        {friends.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {friends.map(friend => (
              <div
                key={friend.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/messages/${friend.id}`)}
              >
                <img 
                  src={friend.avatar || '/assets/images/poringAvatar.png'} 
                  alt="Аватар"
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    marginBottom: '10px' 
                  }}
                />
                <h3 style={{ margin: '0 0 5px 0' }}>{friend.login}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                  Друзья с: {new Date(friend.friendship_date).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/messages/${friend.id}`);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Написать сообщение
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            У вас пока нет друзей
          </div>
        )}
      </div>

      {/* Кнопка добавления в друзья в профиле пользователя */}
      <div style={{ marginTop: '30px' }}>
        <h3>Найти друзей</h3>
        <p>Перейдите в профиль пользователя, чтобы отправить запрос в друзья</p>
      </div>
    </div>
  );
};

export default FriendsPage;