import React, { useState, useRef, useEffect } from 'react';
import AuthManager from '../auth/AuthManager';
import { Link } from 'react-router-dom';
import './Navbar.scss';
import API_ENDPOINTS from '../../config/api';
import {socketManager} from '../../utils/socketManager';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const modalRef = useRef(null);

    const fetchUnreadCount = async (userId) => {
        if (!userId) {
            console.log('Navbar userId не передан в fetchUnreadCount');
            return;
        }
        try {
            console.log('📊 Запрашиваем количество непрочитанных для пользователя:', userId);

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ Navbar: Токен не найден');
                return;
            }

            const response = await fetch(API_ENDPOINTS.unreadCount(currentUser.id), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                console.error('❌ Navbar: Неавторизован, обновляем токен');
                // Можно добавить логику обновления токена
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                console.log('📊 Получено непрочитанных сообщений:', data.count);
                setUnreadMessages(data.count || 0);
            }
        } catch (error) {
            console.error('Ошибка получения непрочитанных сообщений:', error);
        }
    };

     useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                console.log('👤 Загружен пользователь из localStorage:', user);
                setCurrentUser(user);

                socketManager.connect(user.id);

                fetchUnreadCount(user.id);
    
            } catch (error) {
                console.error('❌ Ошибка парсинга пользователя из localStorage:', error);
            }
        }
    }, []);

    useEffect(() => {
        const handleUnreadCountChanged = (event) => {
            console.log('📊 Navbar: Получено событие unreadCountChanged:', event.detail.count);
            setUnreadMessages(event.detail.count);
        };

        const handleNewMessage = () => {
            console.log('📨 Navbar: Получено новое сообщение, обновляем счетчик');
            if (currentUser?.id) {
                fetchUnreadCount(currentUser.id);
            }
        };

         const handleUserAuthChange = () => {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
                fetchUnreadCount(user.id);
            } else {
                setCurrentUser(null);
                setUnreadMessages(0);
                socketManager.disconnect();
            }
        };

        const handleMessagesRead = () => {
            console.log('✅ Navbar: Сообщения прочитаны, сбрасываем счетчик');
            setUnreadMessages(0);
            if (currentUser?.id) {
                // Проверяем через API
                setTimeout(() => fetchUnreadCount(currentUser.id), 1000); // ← Исправлено
            }
        };

        window.addEventListener('unreadCountChanged', handleUnreadCountChanged);
        window.addEventListener('newMessageReceived', handleNewMessage);
        window.addEventListener('userAuthChange', handleUserAuthChange);
        window.addEventListener('messagesRead', handleMessagesRead);

        const intervalId = currentUser?.id ? setInterval(() => {
            fetchUnreadCount(currentUser.id);
        }, 30000) : null;
        
        // Очистка при размонтировании
        return () => {
            window.removeEventListener('unreadCountChanged', handleUnreadCountChanged);
            window.removeEventListener('newMessageReceived', handleNewMessage);
            window.removeEventListener('userAuthChange', handleUserAuthChange);
            window.removeEventListener('messagesRead', handleMessagesRead);
            if (intervalId) clearInterval(intervalId);
        };
    }, [currentUser, unreadMessages]);

    const handleToggle = () => {
        if (currentUser) {
            handleLogout();
        } else {
            setIsOpen(!isOpen); 
        }
    };

    const handleLogout = () => {
        console.log('🚪 Выход из системы');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setUnreadMessages(0);
        setIsOpen(false);
        
        socketManager.disconnect();

        window.dispatchEvent(new Event('userAuthChange'));
        window.location.reload();
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <nav>
                <ul>
                    <li><img src='/assets/images/sura.png' width="80px"/></li>
                    <li>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <h2>FORUM</h2>
                        </Link>
                    </li>
                    <li>
                        <Link to="/friends" style={{ textDecoration: 'none' }}>
                            Друзья
                        </Link>
                    </li>
                    <li>
                        <Link to="/messages" style={{ textDecoration: 'none' }}>
                            Сообщения
                            <span className={`message-badge ${unreadMessages === 0 ? 'zero' 
                                : 'has-unread'}`}>
                                {unreadMessages > 99 ? '99+' : unreadMessages}
                            </span>
                        </Link>
                    </li>
                </ul>
                <ul>
                    <li>
                        {currentUser ? (
                            <div className='user-menu'>
                                <Link
                                    className='profile-btn'
                                    to="/profile"
                                    title="Личный кабинет"
                                >
                                    <img 
                                        className='profile_btn'
                                        src={currentUser.avatar || '/assets/images/poringAvatar.png'}
                                        width="40px"
                                        alt="Profile"
                                        onError={(e) => {
                                            e.target.src = '/assets/images/poringAvatar.png';
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <span className='username'>{currentUser.username}</span>
                                </Link>
                                <button
                                    className='logout-btn'
                                    onClick={handleLogout}
                                    title="Выйти"
                                >
                                    <img 
                                        className='logout_btn'
                                        src="/assets/images/exit_icon.png"
                                        width="40px"
                                        alt="Exit"
                                    />
                                    <span className='loginPc'>EXIT</span>
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleToggle}>
                                <img 
                                    className='entrace_btn'
                                    src='/assets/images/entrace_icon.png'
                                    width='70px'
                                    alt='Login'
                                />
                                <h2 className='loginPc'>LOG IN</h2>
                            </button>
                        )}

                        <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
                            <div className='modal-content' ref={modalRef}>
                                <AuthManager 
                                    onLoginSuccess={(userData) => {
                                        setCurrentUser(userData);
                                        setIsOpen(false);
                                        socketManager.connect(userData.id);
                                        fetchUnreadCount(userData.id);
                                    }}
                                />
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        </>
    );
}

export default Navbar;