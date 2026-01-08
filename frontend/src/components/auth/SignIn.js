import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../../config/api';

const SignIn = ({ onLoginSuccess, onNeedsVerification }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if(data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        switch (data.errorType) {
          case 'user_not_found':
            setError("Пользователь не найден. Проверьте логин или зарегестрируйтесь");
            break;
          case 'email_not_verified':
            setError("Email не подтверждён. Проверьте вашу почту.");
            if (data.email) {
              setTimeout(() => {
                if (window.confirm("Отправить код подтверждения повторно?")) {
                  onNeedsVerification(data.email);
                }
              }, 1000);
            }
            break;
          case 'invalid_password':
            setError("Неверный пароль");
            setShowForgotPassword(true);
            break;
          default:
            setError(data.message || 'Ошибка при входе');
        }
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false)
    }
  };

  const handleForgotPassword = () => {
    alert("Функция восстановления пароля будет реализована позже");
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.resendVerification, {
        method: 'POST',
        headers:  {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.login
        })
      });

      const data = await response.json();

      if (data.succes) {
        alert("Новый код подтверждения отправлен на вашу почту!");
        onNeedsVerification(formData.login);
      } else {
        alert(data.message || "Ошибка при отправке кода");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка соединения");
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Вход</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {error.includes("Email не подтверждён") && (
        <div style={{ marginTop: '10px' }}>
          <button
            type='button'
            onClick={handleResendVerification}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Отправить код повторно
          </button>
        </div>
      )}
      

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            name="login"
            placeholder="Login or Email"
            value={formData.login}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              border: error && error.includes("Пользователль не найден" ? '1px solid red' : '1px solid #ddd')
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              border: error && error.includes("Неверный пароль" ? '1px solid red' : '1px solid #ddd')
            }}
          />
        </div>

        {showForgotPassword && (
          <div style={{ marginBottom: '15px' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Забыли пароль?
            </button>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default SignIn;