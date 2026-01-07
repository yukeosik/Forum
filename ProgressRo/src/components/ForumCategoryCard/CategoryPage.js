import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreateTopicForm from './CreateTopicForm';
import '../../styles/ForumCategory/CategoryPage.scss';
import API_ENDPOINTS from '../../config/api';

const API_URL = 'http://localhost:3000';

const CategoryPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategoryData();
    }, [categoryId]);

    const fetchCategoryData = async () => {
        try {
            const [categoryRes, topicsRes] = await Promise.all([
                fetch(API_ENDPOINTS.category(categoryId)),
                fetch(API_ENDPOINTS.categoryTopics(categoryId))
            ]);

            const categoryData = await categoryRes.json();
            const topicsData = await topicsRes.json();

            if (categoryData.success) setCategory(categoryData.category);
            if (topicsData.success) setTopics(topicsData.topics);
        } catch (error) {
            console.error("Ошибка", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTopicCreated = () => {
        setShowCreateForm(false);
        fetchCategoryData(); //Обновление списка тем
    };

    const handleTopicCLick = (topicId) => {
        navigate(`/topic/${topicId}`);
    }

    if (loading) return <div>Загрузка...</div>
    if (!category) return <div>Категория не найдена</div>

    return (
        <div className='category-page'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>{category.name}</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{
                        padding: '10px 20px',
                        backGroundColor: "#28a745",
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {showCreateForm ? "Отмена" : "Новая тема"}
                </button>
            </div>
            {showCreateForm && (
                <CreateTopicForm 
                    categoryId={categoryId}
                    onTopicCreated={handleTopicCreated}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            <div className='topics-list'>
                {topics.map(topic => (
                    <div
                        key={topic.id}
                        className='topic-item'
                        onClick={() => handleTopicCLick(topic.id)}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                                    {topic.is_pinned === 1 && '📌 '}
                                    {topic.title}
                                </h3>
                                <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                                    {topic.content.length > 150 ? topic.content.substring(0, 150) + '...' : topic.content}
                                </p>
                                <div style={{ fontSize: '14px', color: '#888' }}>
                                    <img 
                                        src={topic.author_avatar || '/assets/images/poringAvatar.png'} 
                                        alt="Аватар" 
                                        className="avatar-small"
                                        onError={(e) => {
                                            e.target.src = '/assets/images/poringAvatar.png';
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <span>Автор: {topic.author_name}</span>
                                    <span style={{ marginLeft: '15px' }}>Сообщений: {topic.post_count || 0}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '14px', color: '#666' }}>
                                <div>
                                    Создано: {new Date(topic.created_at).toLocaleDateString()}
                                </div>
                                {topic.last_post_date && (
                                    <div>
                                        Обновлено: {new Date(topic.updated_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryPage;