import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../../config/api';

const ReactionsComponent = ({ postId, currentUser }) => {
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Нравится' },
    { type: 'dislike', emoji: '👎', label: 'Не нравится' },
    { type: 'laugh', emoji: '😂', label: 'Смешно' },
    { type: 'love', emoji: '❤️', label: 'Люблю' },
    { type: 'wow', emoji: '😮', label: 'Ух ты' },
    { type: 'sad', emoji: '😢', label: 'Грустно' }
  ];
  
  useEffect(() => {
    fetchReactions();
  }, [postId]);
  
  const fetchReactions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.postReactions(postId));
      const data = await response.json();
      
      if (data.success) {
        setReactions(data.reactions);
        
        // Определяем реакцию текущего пользователя
        if (currentUser) {
          for (const type in data.reactions) {
            if (data.reactions[type].some(r => r.user_id === currentUser.id)) {
              setUserReaction(type);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки реакций:', error);
    }
  };
  
  const handleReaction = async (reactionType) => {
    if (!currentUser) {
      alert('Войдите, чтобы ставить реакции');
      return;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.postReactions(postId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          reactionType: reactionType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchReactions(); // Обновляем реакции
      }
    } catch (error) {
      console.error('Ошибка отправки реакции:', error);
    }
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {reactionTypes.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            title={label}
            style={{
              padding: '4px 8px',
              background: userReaction === type ? '#e3f2fd' : '#f5f5f5',
              border: '1px solid',
              borderColor: userReaction === type ? '#2196f3' : '#ddd',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
          >
            {emoji}
            {reactions[type] && (
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>
                {reactions[type].length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Попап с пользователями, поставившими реакции */}
      <div style={{ fontSize: '12px', color: '#666' }}>
        {Object.keys(reactions).length > 0 && (
          <details>
            <summary style={{ cursor: 'pointer' }}>
              {Object.values(reactions).flat().length} реакций
            </summary>
            <div style={{ 
              position: 'absolute', 
              background: 'white', 
              border: '1px solid #ddd',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '5px',
              zIndex: 1000
            }}>
              {Object.entries(reactions).map(([type, reactionList]) => (
                <div key={type}>
                  <strong>
                    {reactionTypes.find(r => r.type === type)?.emoji} {reactionList.length}
                  </strong>
                  <div style={{ marginLeft: '10px' }}>
                    {reactionList.slice(0, 5).map(reaction => (
                      <div key={reaction.id}>{reaction.user_name}</div>
                    ))}
                    {reactionList.length > 5 && (
                      <div>и ещё {reactionList.length - 5}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ReactionsComponent;