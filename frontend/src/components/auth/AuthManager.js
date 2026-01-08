import React, { useState, useEffect } from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';
import EmailVerification from './EmailVerification';

const AuthManager = ({ onLoginSuccess }) => {
  const [currentView, setCurrentView] = useState('signin');
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  const handleRegisterSuccess = (newUserId) => {
    console.log('handleRegisterSuccess вызван с:', newUserId);
    setUserId(newUserId);
    setCurrentView('verification');
  };

  const handleVerificationSuccess = () => {
    setCurrentView('signin');
    alert('Email успешно подтвержден! Теперь вы можете войти.');
  };

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('token', token);

    console.log('Токен сохранён:', token ? 'Да' : 'Нет');
    console.log('Данные пользователя:', userData);

    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
    window.location.reload(); // Перезагружаем страницу
  };

  const handleNeedsVerification = (verificationUserId) => {
    setUserId(verificationUserId);
    setCurrentView('verification');
  };

  // Проверяем, есть ли сохраненный пользователь
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    console.log('currentView:', currentView);
    console.log('userId:', userId);
  }, [currentView, userId]);

  if (user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Добро пожаловать, {user.username}!</h1>
        <p>Email: {user.email}</p>
        <button onClick={() => {
          setUser(null);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
          window.location.reload();
        }}>
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      {currentView === 'signin' && (
        <div>
          <SignIn 
            onLoginSuccess={handleLoginSuccess}
            onNeedsVerification={handleNeedsVerification}
          />
          <button 
            onClick={() => setCurrentView('signup')}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Нет аккаунта? Зарегистрироваться
          </button>
        </div>
      )}
      
      {currentView === 'signup' && (
        <div>
          <SignUp onRegisterSuccess={handleRegisterSuccess} />
          <button 
            onClick={() => setCurrentView('signin')}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Уже есть аккаунт? Войти
          </button>
        </div>
      )}
      
      {currentView === 'verification' && (
        <EmailVerification 
          userId={userId}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
};

export default AuthManager;