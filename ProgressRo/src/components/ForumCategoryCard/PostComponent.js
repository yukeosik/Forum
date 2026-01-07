import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactionsComponent from './ReactionsComponent';

const PostComponent = ({ post, posts, currentUser, onReply }) => {
  const navigate = useNavigate();
  const replies = posts.filter(p => p.parent_post_id === post.id);
  
  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/user/${post.author_id}`);
  };

  return (
    <div className="post" style={{ 
      marginLeft: post.parent_post_id ? '30px' : '0',
      marginBottom: '15px',
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      background: 'white'
    }}>
      {/* Заголовок сообщения с кнопкой ответа */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={post.author_avatar || '/assets/images/poringAvatar.png'} 
            alt="Аватар" 
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
            onClick={handleProfileClick}
            onError={(e) => {
              e.target.src = '/assets/images/poringAvatar.png';
              e.target.onerror = null;
            }}
          />
          <div>
            <strong style={{ display: 'block' }}
              onClick={handleProfileClick}
            >
              {post.author_name}
            </strong>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {new Date(post.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        {currentUser && (
          <button 
            onClick={() => onReply(post)}
            style={{ 
              padding: '5px 10px', 
              background: '#007bff', 
              color: 'white',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Ответить
          </button>
        )}
      </div>
      
      {/* Содержимое сообщения */}
      <div style={{ 
        lineHeight: '1.5', 
        marginBottom: '15px',
        padding: '10px',
        background: '#f9f9f9',
        borderRadius: '4px'
      }}>
        {post.content}
      </div>
      
      {/* Реакции */}
      <ReactionsComponent postId={post.id} currentUser={currentUser} />
      
      {/* Ответы на это сообщение */}
      {replies.length > 0 && (
        <div style={{ 
          borderLeft: '3px solid #007bff', 
          paddingLeft: '20px', 
          marginTop: '20px'
        }}>
          {replies.map(reply => (
            <PostComponent 
              key={reply.id} 
              post={reply} 
              posts={posts}
              currentUser={currentUser}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostComponent;