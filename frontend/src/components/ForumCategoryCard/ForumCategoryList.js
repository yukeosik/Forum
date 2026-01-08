import React, { useState, useEffect } from 'react';
import ForumCategoryCard from './ForumCategoryCard';
import API_ENDPOINTS from '../../config/api';

const ForumCategoryList = ({ title = "Форум" }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            console.log('🔄 Загрузка категорий...');
            const response = await fetch(API_ENDPOINTS.categories);
            const data = await response.json();

            console.log('📨 Ответ от сервера:', data);

            if (data.success) {
                setCategories(data.categories);
            } else {
                setError(data.message || "Ошибка загрузки категорий");
            }
        } catch (error) {
            console.error("Ошибка:", error);
            setError("Ошибка соединения");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Загрузка категорий...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>

    return (
        <div className='forumCategories'>
            <h2>{title}</h2>
            <div className='categories-grid'>
                {categories.map((category) => (
                    <ForumCategoryCard 
                        key={category.id}
                        name={category.name}
                        topicCount={category.topicCount || 0}
                        postCount={category.postCount || 0}
                        lastActivity={category.lastActivity}
                        category={category}
                        categoryId={category.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default ForumCategoryList;