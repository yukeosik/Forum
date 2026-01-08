import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Main_content } from './components/Main_content';
import AuthManager from './components/auth/AuthManager';
import CategoryPage from './components/ForumCategoryCard/CategoryPage';
import TopicPage from './components/ForumCategoryCard/TopicPage';
import Profile from './components/auth/profile';
import UserProfile from './components/ForumCategoryCard/UserProfile';
import MessagesPage from './components/ForumCategoryCard/MessagesPage';
import FriendsPage from './components/ForumCategoryCard/FriendsPage';
import './styles/main.scss';

function App() {
    return (
        <Router>
            <Navbar />
            <div className="main-container">
                <Routes>
                    <Route path="/" element={<Main_content />} />
                    <Route path="/auth" element={<AuthManager />} />
                    <Route path="/category/:categoryId" element={<CategoryPage />} />
                    <Route path="/topic/:topicId" element={<TopicPage />} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/messages/:friendId" element={<MessagesPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
        </Router>
    );
}

const NotFound = () => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>404 - Страница не найдена</h2>
        <p>Запрошенная страница не существует.</p>
    </div>
);

export default App;