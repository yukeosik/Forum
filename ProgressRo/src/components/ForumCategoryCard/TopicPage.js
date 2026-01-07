import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostComponent from './PostComponent';
import ReactionsComponent from './ReactionsComponent';
import '../../styles/ForumCategory/TopicPage.scss';
import API_ENDPOINTS from '../../config/api';

const TopicPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    fetchTopicData();
  }, [topicId]);

  const fetchTopicData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.topic(topicId));
      const data = await response.json();
      
      if (data.success) {
        setTopic(data.topic);
        setPosts(data.posts);
        setEditData({ title: data.topic.title, content: data.topic.content });
      } else {
        console.error('Ошибка загрузки темы:', data.message);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyTo = (post) => {
  setReplyTo(post);
  // Прокрутка к форме
  setTimeout(() => {
    const formElement = document.getElementById('replyForm');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
};

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const response = await fetch(API_ENDPOINTS.addPost(topicId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPost,
          authorId: currentUser.id,
          parentPostId: replyTo ? replyTo.id : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
      setNewPost('');
      setReplyTo(null);
      setPosts(prevPosts => [...prevPosts, data.post]);
    } else {
      alert(data.message);
    }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка отправки сообщения');
    } finally {
      setPosting(false);
    }
  };

  const handleEditTopic = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_ENDPOINTS.topic(topicId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title,
          content: editData.content,
          authorId: currentUser.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTopic(prev => ({ ...prev, ...editData }));
        setEditing(false);
        alert('Тема обновлена!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка редактирования темы');
    }
  };

  const isAuthor = currentUser && topic && currentUser.id === topic.author_id;

  if (loading) return <div>Загрузка темы...</div>;
  if (!topic) return <div>Тема не найдена</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Кнопка назад */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Назад к категории
      </button>

      {/*Заголовок темы*/}
      <div className='topic-page'>
        {editing ? (
          <form onSubmit={handleEditTopic}>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                fontSize: '24px',
                fontWeight: 'bold',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <textarea
              value={editData.content}
              onChange={(e) => setEditData({...editData, content: e.target.value})}
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
            <div>
              <button type="submit" style={{ marginRight: '10px' }}>Сохранить</button>
              <button type="button" onClick={() => setEditing(false)}>Отмена</button>
            </div>
          </form>
        ) : (
          <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1 style={{ margin: '0 0 10px 0', flex: 1 }}>
                {topic.title}
              </h1>
              {isAuthor && (
                <button 
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Редактировать
                </button>
              )}
            </div>
            <p style={{ margin: '0 0 15px 0', fontSize: '16px', lineHeight: '1.5' }}>
              {topic.content}
            </p>
            <div style={{ color: '#666', fontSize: '14px' }}>
              <div>Категория: {topic.category_name}</div>
              <img 
                  src={topic.author_avatar || '/assets/images/poringAvatar.png'} 
                  alt="Аватар" 
                  className="avatar-small"
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/user/${topic.author_id}`)}
                  onError={(e) => {
                    e.target.src = '/assets/images/poringAvatar.png';
                    e.target.onerror = null;
                  }}
                />
              <div>Автор: {topic.author_name}</div>
              <div>Создано: {new Date(topic.created_at).toLocaleString()}</div>
              {topic.updated_at !== topic.created_at && (
                <div>Обновлено: {new Date(topic.updated_at).toLocaleString()}</div>
              )}
            </div>
          </>
        )}
      </div>

        {/* Сообщения 
        <div className="posts-list">
          <h2>Сообщения ({posts.length})</h2>
          {posts.map((post, index) => (
              <div 
                key={post.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: index === 0 ? '#f8f9fa' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <img 
                    src={post.author_avatar || '/assets/images/poringAvatar.png'} 
                    alt="Аватар" 
                    className="avatar-small"
                    onError={(e) => {
                      e.target.src = '/assets/images/poringAvatar.png';
                      e.target.onerror = null;
                    }}
                  />
                  <strong>{post.author_name}</strong>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ lineHeight: '1.5' }}>
                  {post.content}
                </div>
              </div>
          ))}
        </div>
      */}

    <div className="posts-list" style={{ marginTop: '30px' }}>
      <h2>Сообщения ({posts.length})</h2>
      {posts
          .filter(post => !post.parent_post_id)
          .map(post => (
            <PostComponent 
              key={post.id}
              post={post}
              posts={posts}
              currentUser={currentUser}
              onReply={handleReplyTo}
            />
          ))}
      </div>

        {/* Блок ответа на сообщение */}
      {replyTo && (
        <div id="replyForm" style={{ 
          background: '#f0f8ff', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '20px',
          borderLeft: '4px solid #007bff'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Ответ на сообщение:</strong>
            <div style={{ 
              background: '#e9ecef', 
              padding: '10px', 
              borderRadius: '4px',
              marginTop: '5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src={replyTo.author_avatar || '/assets/images/poringAvatar.png'}
                  alt="Аватар"
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
                <strong>{replyTo.author_name}:</strong>
              </div>
              <div style={{ marginTop: '5px' }}>{replyTo.content}</div>
            </div>
          </div>
          <button 
            onClick={() => setReplyTo(null)}
            style={{ 
              padding: '4px 8px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Отменить ответ
          </button>
        </div>
      )}

        {/* Форма нового сообщения */}
        {currentUser && (
          <form onSubmit={handleAddPost} style={{ marginTop: '30px' }}>
            <h3>Добавить сообщение</h3>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Введите ваше сообщение..."
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                resize: 'vertical',
                marginBottom: '10px'
              }}
            />
            <button 
              type="submit"
              disabled={posting || !newPost.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: posting ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: posting ? 'not-allowed' : 'pointer'
              }}
            >
              {posting ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        )}
      </div> 
  );
};

export default TopicPage;