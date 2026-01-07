import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../../config/api';

const EmailVerification = ({ userId, onVerificationSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

   useEffect(() => {
    console.log('EmailVerification получил userId:', userId);
    console.log('Тип userId:', typeof userId);
    
    if (userId) {
      setUserEmail(userId);
    } else {
      console.error('userId is undefined или null');
    }
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!userEmail) {
      setError('Ошибка: email не найден. Пожалуйста, зарегистрируйтесь снова.');
      setLoading(false);
      return;
    }

    if (!code || code.length !== 6) {
      setError('Введите 6-значный код подтверждения');
      setLoading(false);
      return;
    }

    console.log('Отправляемые данные:', {
    email: userId,
    code: code
  });

    try {
      const response = await fetch(API_ENDPOINTS.verify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userId,
          code
        })
      });

      const data = await response.json();
      console.log('Server response:', data);
      
      if (data.success) {
        onVerificationSuccess();
      } else {
        setError(data.message || 'Error from confirmation');
      }
    } catch (error) {
      console.error('Network error: ', error);
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Подтверждение Email</h2>
      {userEmail ? (
        <p>Введите код, отправленный на вашу почту: <strong>{userEmail}</strong></p>
      ) : (
        <p style={{ color: 'red' }}>Ошибка: email не найден</p>
      )}
      <p style={{ fontSize: '12px', color: '#666' }}>
        (В development режиме код показывается в консоли сервера)
      </p>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Код подтверждения"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>
        
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
          {loading ? 'Проверка...' : 'Подтвердить'}
        </button>
      </form>
    </div>
  );
};

export default EmailVerification;