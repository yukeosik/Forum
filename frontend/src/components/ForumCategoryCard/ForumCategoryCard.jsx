import React from 'react';
import '../../styles/ForumCategory/ForumCategoryCard.scss';
import { useNavigate } from 'react-router-dom';


export default function ForumCategoryCard({
    category,
    categoryId,
    name,
    topicCount = 0,
    postCount = 0,
    lastActivity,
    onClick
}) {
    const displayName = name || category?.name || "Без названия";
    const displayTopicCount = topicCount || category?.topicCount || 0;
    const displayPostCount = postCount || category?.postCount || 0;
    const displayLastActivity = lastActivity || category?.lastActivity;
    const navigate = useNavigate();

    const getDaysAgo = (dateString) => {
        if (!dateString) return "Нет активности";
        const lastDate = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - lastDate.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return days === 0 ? "Сегодня" : `${days} дней назад`;
    };

    const handleClick = () => {
        if (onClick) {
            onClick(categoryId || category?.id);
        }
        navigate(`/category/${categoryId}`);
    };
    return (
        <div className="card" onClick={handleClick} style={{ cursor: 'pointer' }}>
            <div className="main-info">
                <h3 className="title">{displayName}</h3>
                <div className="stats">
                    <span>Темы: {displayTopicCount}</span>
                    <span>Сообщения: {displayPostCount}</span>
                </div>
            </div>

            <div className="lastActivity">
                

                <div className="userInfo">
                    <span className="username">{displayLastActivity?.user?.name || "Нет активности"}</span>
                    <span className="date">
                        {getDaysAgo(displayLastActivity?.date)}
                    </span>
                </div>
            </div>
        </div>
    );
};