import React, { useState } from 'react';
import API_ENDPOINTS from '../../config/api';

const CreateTopicForm = ({ categoryId, onTopicCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('📤 Данные формы:', formData);
        console.log('🎯 Category ID:', categoryId);

        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));

            if (!currentUser || !currentUser.id) {
                setError('Вы не авторизованы');
                setLoading(false);
                return;
            }

            

            const requestData = {
                title: formData.title,
                content: formData.content,
                categoryId: parseInt(categoryId),
                authorId: currentUser.id
            };

            if (formData.title.length < 5) {
                setError('Заголовок должен содержать не менее 5 символов');
                setLoading(false);
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(API_ENDPOINTS.createTopic, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });

            clearTimeout(timeoutId)

            console.log('📨 Статус ответа:', response.status);

            const responseText = await response.text();
            console.log('📨 Текст ответа:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
                } catch (parseError) {
                console.error('❌ Ошибка парсинга JSON:', parseError);
                throw new Error('Сервер вернул не JSON: ' + responseText.substring(0, 100));
            }

            console.log('📨 Данные ответа:', data);

            if (response.ok) {
                onTopicCreated();
                setFormData({ title: '', content: '' });
            } else {
                setError(data.message || 'Ошибка создания темы');
            }
            } catch (error) {
                console.error('❌ Ошибка:', error);
                setError(error.message || 'Ошибка соединения');
            }
            setLoading(false);
    };

    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: '#f9f9f9'
        }}>
            <h3>Создать новую тему</h3>
            {error && (
                <div style={{ color: 'red', marginBottom: '15px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type='text'
                        placeholder='Заголовок темы'
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <textarea 
                        placeholder='Содержание темы...'
                        value={formData.content}
                         onChange={(e) => setFormData({...formData, content: e.target.value})}
                        required
                        rows='6'
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '16px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type='submit'
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Создание...' : 'Создать тему'}
                    </button>

                    {onCancel && (
                        <button
                            type='button'
                            onClick={onCancel}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Отмена
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreateTopicForm;