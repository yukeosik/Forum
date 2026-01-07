// Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../../config/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const getAuthHeaders = (json = true) => {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (json) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('🔑 Заголовки запроса:', headers);
    return headers;
  };

  // Когда компонент Profile загружается:
  useEffect(() => {
    fetchUserProfile(); // Вызывается функция загрузки профиля
  }, []);

  const fetchUserProfile = async () => {
  try {
    // 1. Берём данные пользователя из localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');

    if (!token || !savedUser) {
      console.log('Нет токена или данных пользователя');
      navigate('/auth');
      return;
    }

    const currentUser = JSON.parse(savedUser);
    
    const response = await fetch(API_ENDPOINTS.profile, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log('Статус ответа:', response.status);

    if (response.status === 401 || response.status === 403) {
      // Токен недействителен
      console.log('Токен недействителен, разлогиниваем');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      navigate('/auth');
      return;
    }

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    // 3. Получаем ответ от сервера
    const data = await response.json();
    
    if (data.success) {
      // Объединяем данные из localStorage и с сервера
      const mergedUser = {
        ...currentUser, // данные из localStorage
        ...data.user,   // свежие данные с сервера (включая created_at)
        avatar: data.user.avatar || currentUser.avatar // приоритет у сервера, но fallback на localStorage
      };
      
      // 4. Обновляем состояние компонента
      setUser(mergedUser);
      // Обновляем localStorage
      localStorage.setItem('currentUser', JSON.stringify(mergedUser));
    } else {
      // Если сервер вернул ошибку, используем данные из localStorage
      setUser(currentUser);
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  } finally {
    setLoading(false);
  }
};

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа файла
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Пожалуйста, выберите файл изображения (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setUploading(true);
    
    try {
      const savedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');

      if (!savedUser || !token) {
        navigate('/auth');
        return;
      }
      
      const currentUser = JSON.parse(savedUser);

      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(API_ENDPOINTS.uploadAvatar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedUser = {
          ...currentUser,
          avatar: data.avatarUrl
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        setUser(updatedUser);
        window.dispatchEvent(new Event('userAvatarChanged'));
        alert('Аватар успешно обновлен!');
      } else {
        alert('Ошибка: ' + data.message);
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      alert('Ошибка загрузки аватара');
    } finally {
      setUploading(false);
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  }

  const removeAvatar = async () => {
    if (!confirm('Удалить аватар?')) return;

    try {
      const savedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');

      if (!savedUser || !token) {
        navigate('/auth');
        return;
      }
      
      const currentUser = JSON.parse(savedUser);

      const response = await fetch(API_ENDPOINTS.removeAvatar, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          userId: currentUser.id 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Обновляем данные в localStorage
        const updatedUser = {
          ...currentUser,
          avatar: null
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        setUser(updatedUser);

        window.dispatchEvent(new Event('userAvatarDeleted'));
        
        alert('Аватар удален!');
      } else {
        alert('Ошибка: ' + data.message);
      }
    } catch (error) {
      console.error('Ошибка удаления аватара:', error);
      alert('Ошибка удаления аватара');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Личный кабинет</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ position: 'relative' }}>
          <img 
            src={user.avatar || '/assets/images/poringAvatar.png'} 
            alt="Аватар" 
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              marginRight: '20px'
            }}
            onError={(e) => {
              e.target.src = '/assets/images/poringAvatar.png';
              e.target.onerror = null;
            }}
          />
          {uploading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              Загрузка...
            </div>
          )}
        </div>
        <div>
          <h2>{user.username || user.login}</h2>
          <p>Email: {user.email}</p>
          <p>Дата регистрации: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Неизвестно'}</p>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h3>Смена аватара</h3>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={triggerFileInput}
            disabled={uploading}
            style={{ 
              padding: '10px 20px', 
              background: uploading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Загрузка...' : 'Выбрать файл'}
          </button>

          {user.avatar && user.avatar !== '/assets/images/poringAvatar.png' && (
            <button 
              onClick={removeAvatar}
              disabled={uploading}
              style={{ 
                padding: '10px 20px', 
                background: uploading ? '#ccc' : '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              Удалить аватар
            </button>
          )}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Поддерживаемые форматы: JPEG, PNG, GIF, WebP (до 5MB)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Profile;