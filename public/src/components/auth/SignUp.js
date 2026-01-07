import React, { useState } from 'react';
import '../../styles/errors-style.scss'
import API_ENDPOINTS from '../../config/api';

const SignUp = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });
  
  // Объект для хранения всех ошибок
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    confirmEmail: '', 
    password: '',
    confirmPassword: '',
    general: ''
  });

  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'username':
        if (value.length < 3) {
          newErrors.username = 'Логин должен содержать минимум 3 символа';
        } else if (value.length > 20) {
          newErrors.username = 'Логин не должен превышать 20 символов';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'Логин может содержать только буквы, цифры и нижнее подчеркивание';
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors.email = 'Введите корректный email адрес';
        } else {
          delete newErrors.email;
        }

        if (formData.confirmEmail) {
          if (value !== formData.confirmEmail) {
            newErrors.confirmEmail = "Email don't match";
          } else {
            delete newErrors.confirmEmail;
          }
        }
        break;
        
      case 'confirmEmail':
        if (formData.email && value) {
          if (formData.email !== value) {
            newErrors.confirmEmail = 'Email адреса не совпадают';
          } else {
            delete newErrors.confirmEmail;
          }
        } else {
          delete newErrors.confirmEmail;
        }
        break;
        
      case 'password':
        if (value.length < 6) {
          newErrors.password = 'Пароль должен содержать минимум 6 символов';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
          newErrors.password = 'Пароль должен содержать заглавные и строчные буквы';
        } else if (!/(?=.*\d)/.test(value)) {
          newErrors.password = 'Пароль должен содержать хотя бы одну цифру';
        } else if (value.length > 30) {
          newErrors.password = "Пароль не должен содержать больше 30 символов";
        } else {
          delete newErrors.password;
        }
          

        if(formData.confirmPassword) {
          if(value !== formData.confirmPassword) {
            newErrors.confirmPassword = "Password don't match";
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
        
      case 'confirmPassword':
        if(formData.password && value) {
          if (formData.password !== value) {
            newErrors.confirmPassword = "Password don't match";
          } else {
            delete newErrors.confirmPassword;
          }
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку при изменении поля
    setErrors(prev => ({ ...prev, [name]: '' }));

    validateField(name, value);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.username.length < 3) {
      newErrors.username = 'Логин должен содержать минимум 3 символа';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }
    
    if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'Email адреса не совпадают';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    } else if(formData.password.length > 30) {
      newErrors.password = 'Пароль не должен содержать больше 30 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({ ...errors, general: '' }); // очищаем общие ошибки

    
    
    try {
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onRegisterSuccess(formData.email);
      } else {
        setErrors(prev => ({ ...prev, general: data.message }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Ошибка соединения' }));
    }
    setLoading(false);
  };

  return (
    <div className="auth-form">
      <h2>Регистрация</h2>
      
      {/* Общая ошибка */}
      {errors.general && (
        <div className="error general-error">
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Поле логина */}
        <div>
          <p>Login</p>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? 'error-input' : ''}
          />
          {errors.username && (
            <div className="error field-error">
              {errors.username}
            </div>
          )}
        </div>

        {/* Поле email */}
        <div>
          <p>Email</p>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error-input' : ''}
          />
          {errors.email && (
            <div className="error field-error">
              {errors.email}
            </div>
          )}
        </div>

        <div>
          <p>Confirm the email</p>
          <input
            type='email'
            name='confirmEmail'
            value={formData.confirmEmail}
            onChange={handleChange}
            className={errors.confirmEmail ? 'error-input' : ''}
          />
          {errors.confirmEmail && (
            <div className='error field-error'>
              {errors.confirmEmail}
            </div>
          )}
        </div>

        <div>
          <p>Password</p>
          <input
            type='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error-input' : ''}
          />
          {errors.password && (
            <div className='error field-error'>
              {errors.password}
            </div>
          )}
        </div>

        <div>
          <p>Confirm the password</p>
          <input 
            type='password'
            name='confirmPassword'
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'error-input' : ''}
          />
          {errors.confirmPassword && (
            <div className='error field-error'>
              {errors.confirmPassword}
            </div>
          )}
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export default SignUp;