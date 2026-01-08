import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../../config/api';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [userTopics, setUserTopics] = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.id !== parseInt(userId)) {
        checkFriendship(user.id, userId);
      }
    }
  }, [userId]);

  const checkFriendship = async (currentUserId, profileUserId) => {
  try {
    const response = await fetch(API_ENDPOINTS.friends(currentUserId), {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.success) {
      const isFriend = data.friends.some(friend => friend.id === parseInt(profileUserId));
      setFriendshipStatus(data.status);
    }
  } catch (error) {
    console.error('Ошибка проверки дружбы:', error);
  }
};

const handleFriendRequest = async () => {
  if (!currentUser) {
    alert('Войдите, чтобы добавить в друзья');
    return;
  }
  
  try {
    const response = await fetch(API_ENDPOINTS.sendFriendRequest, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId: currentUser.id,
        friendId: userId
      })
    });
    
    const data = await response.json();
    alert(data.message);
    checkFriendship(currentUser.id, userId);
  } catch (error) {
    console.error('Ошибка отправки запроса:', error);
    alert('Ошибка отправки запроса');
  }
};

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Получаем данные пользователя
      const userResponse = await fetch(API_ENDPOINTS.userInfo(userId), {
        headers: getAuthHeaders()
      });
      const userData = await userResponse.json();
      
      if (userData.success) {
        setUser(userData.user);
        
        // Получаем посты пользователя
        const postsResponse = await fetch(API_ENDPOINTS.userPosts(userId), {
          headers: getAuthHeaders()
        });
        const postsData = await postsResponse.json();
        if (postsData.success) setUserPosts(postsData.posts);
        
        // Получаем темы пользователя
        const topicsResponse = await fetch(API_ENDPOINTS.userTopics(userId), {
          headers: getAuthHeaders()
        });
        const topicsData = await topicsResponse.json();
        if (topicsData.success) setUserTopics(topicsData.topics);
      } else {
        console.error('Ошибка загрузки пользователя:', userData.message);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Назад
      </button>

      <h1>Профиль пользователя</h1>
      {currentUser && currentUser.id !== parseInt(userId) && (
        <div style={{ marginTop: '10px' }}>
          {friendshipStatus === null && (
            <button
              onClick={handleFriendRequest}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Добавить в друзья
            </button>
          )}
          {friendshipStatus === 'pending' && (
            <span style={{ color: '#ffc107' }}>Запрос отправлен</span>
          )}
          {friendshipStatus === 'accepted' && (
            <span style={{ color: '#28a745' }}>✓ Друзья</span>
          )}
        </div>
      )}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px', 
        marginBottom: '30px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: 'white'
      }}>
        <img 
          src={user.avatar || '/assets/images/poringAvatar.png'} 
          alt="Аватар" 
          style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            objectFit: 'cover' 
          }}
          onError={(e) => {
            e.target.src = '/assets/images/poringAvatar.png';
            e.target.onerror = null;
          }}
        />
        <div>
          <h2 style={{ margin: '0 0 10px 0' }}>{user.login}</h2>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Дата регистрации:</strong> {new Date(user.created_at).toLocaleDateString()}
          </p>
          <p style={{ margin: '0' }}>
            <strong>Активность:</strong> {userPosts.length} сообщений, {userTopics.length} тем
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Темы пользователя */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3 style={{ marginTop: 0 }}>Созданные темы ({userTopics.length})</h3>
          {userTopics.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {userTopics.map(topic => (
                <div 
                  key={topic.id}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  <strong>{topic.title}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {new Date(topic.created_at).toLocaleDateString()} • 
                    {topic.post_count} сообщений
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              Пользователь еще не создавал тем
            </div>
          )}
        </div>

        {/* Сообщения пользователя */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3 style={{ marginTop: 0 }}>Последние сообщения ({userPosts.length})</h3>
          {userPosts.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {userPosts.slice(0, 10).map(post => (
                <div 
                  key={post.id}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/topic/${post.topic_id}`)}
                >
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    {post.content.length > 100 
                      ? `${post.content.substring(0, 100)}...` 
                      : post.content}
                  </div>
                  <div style={{ fontSize: '12px', color: '#007bff', marginTop: '5px' }}>
                    Перейти к теме →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              Пользователь еще не оставлял сообщений
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;