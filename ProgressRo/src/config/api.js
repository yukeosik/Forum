const API_BASE = 'http://localhost:3000/api';

const API_ENDPOINTS = {
  // Аутентификация
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,
  verify: `${API_BASE}/auth/verify`,
  resendVerification: `${API_BASE}/auth/resend-verification`,
  
  // Пользователь
  profile: `${API_BASE}/user/profile`,
  uploadAvatar: `${API_BASE}/user/upload-avatar`,
  removeAvatar: `${API_BASE}/user/remove-avatar`,
  
  // Форум
  categories: `${API_BASE}/forum/categories`,
  category: (categoryId) => `${API_BASE}/forum/categories/${categoryId}`,
  categoryTopics: (categoryId) => `${API_BASE}/forum/categories/${categoryId}/topics`,
  topic: (topicId) => `${API_BASE}/forum/topics/${topicId}`,
  createTopic: `${API_BASE}/forum/topics`,
  addPost: (topicId) => `${API_BASE}/forum/topics/${topicId}/posts`,
  postReactions: (postId) => `${API_BASE}/forum/posts/${postId}/reactions`,
  
  // Друзья
  userInfo: (userId) => `${API_BASE}/friends/users/${userId}`,
  userPosts: (userId) => `${API_BASE}/friends/users/${userId}/posts`,
  userTopics: (userId) => `${API_BASE}/friends/users/${userId}/topics`,
  friends: (userId) => `${API_BASE}/friends/${userId}`,
  friendRequests: (userId) => `${API_BASE}/friends/requests/${userId}`,
  sendFriendRequest: `${API_BASE}/friends/request`,
  respondFriendRequest: `${API_BASE}/friends/respond`,
  
  // Сообщения
  sendMessage: `${API_BASE}/messages/send`,
  dialog: (userId, friendId) => `${API_BASE}/messages/dialog/${userId}/${friendId}`,
  conversations: (userId) => `${API_BASE}/messages/conversations/${userId}`,
  unreadCount: (userId) => `${API_BASE}/messages/unread-count/${userId}`
};

export default API_ENDPOINTS;