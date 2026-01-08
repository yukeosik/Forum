const { getDbConnection } = require('../config/database');

class ForumController {
  // Получить все категории
  static async getCategories(req, res) {
    let connection;
    try {
      connection = await getDbConnection();

      const [categories] = await connection.execute(
        `
          SELECT c.id, c.name, c.created_at,
            COUNT(DISTINCT t.id) as topicCount,
            COUNT(DISTINCT p.id) as postCount,
            (SELECT MAX(created_at) FROM topics WHERE category_id = c.id) as last_activity_date
          FROM categories c
          LEFT JOIN topics t ON c.id = t.category_id
          LEFT JOIN posts p ON t.id = p.topic_id
          GROUP BY c.id, c.name, c.created_at
          ORDER BY c.id ASC
        `
      );

      const categoriesWithActivity = await Promise.all(
        categories.map(async (category) => {
          if (category.last_activity_date) {
            const [lastActivity] = await connection.execute(
              `
                SELECT u.login as user_name, u.email as user_email
                FROM topics t
                JOIN users u ON t.author_id = u.id
                WHERE t.category_id = ?
                ORDER BY t.created_at DESC
                LIMIT 1
              `, [category.id]);
            return {
              ...category,
              lastActivity: lastActivity[0] ? {
                date: category.last_activity_date,
                user: {
                  name: lastActivity[0].user_name,
                  email: lastActivity[0].user_email
                }
              } : null
            };
          }
          return category;
        })
      );

      res.json({ success: true, categories: categoriesWithActivity });
    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить категорию по ID
  static async getCategoryById(req, res) {
    const { categoryId } = req.params;
    let connection;

    try {
      connection = await getDbConnection();

      const [categories] = await connection.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (categories.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Категория не найдена' 
        });
      }

      res.json({ 
        success: true, 
        category: categories[0] 
      });

    } catch (error) {
      console.error('Ошибка получения категории:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Создать новую тему
  static async createTopic(req, res) {
    console.log('🎯 /api/topics ВЫЗВАН');
    
    let connection;
    try {
      console.log('📨 Тело запроса:', req.body);
      
      const { title, content, categoryId, authorId } = req.body;
      
      console.log('🔍 Проверка данных:');
      console.log(' - title:', title);
      console.log(' - content length:', content?.length);
      console.log(' - categoryId:', categoryId);
      console.log(' - authorId:', authorId);
      
      if (!title || !content || !categoryId || !authorId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Все поля обязательны' 
        });
      }

      console.log('🔗 Подключение к БД...');
      connection = await getDbConnection();
      console.log('✅ Подключение к БД успешно');

      console.log('💾 Выполнение INSERT запроса...');
      const [result] = await connection.execute(
        'INSERT INTO topics (title, content, author_id, category_id) VALUES (?, ?, ?, ?)',
        [title, content, authorId, categoryId]
      );

      console.log('✅ Тема создана, ID:', result.insertId);

      res.json({ 
        success: true, 
        message: 'Тема создана успешно!',
        topicId: result.insertId 
      });
      
    } catch (error) {
      console.error('❌ ОШИБКА:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Ошибка создания темы: ' + error.message 
      });
    } finally {
      if (connection) {
        await connection.end();
        console.log('🔗 Подключение закрыто');
      }
    }
  }

  // Получить темы категории
  static async getCategoryTopics(req, res) {
    const { categoryId } = req.params;
    let connection;

    try {
      connection = await getDbConnection();

      const [topics] = await connection.execute(`
        SELECT 
          t.*, 
          u.login as author_name,
          u.avatar as author_avatar
        FROM topics t
        JOIN users u ON t.author_id = u.id
        WHERE t.category_id = ?
        ORDER BY t.is_pinned DESC, t.updated_at DESC
      `, [categoryId]);

      for (let topic of topics) {
        const [postCount] = await connection.execute(
          'SELECT COUNT(*) as count FROM posts WHERE topic_id = ?',
          [topic.id]
        );
        topic.post_count = postCount[0].count;
      }

      console.log('🔍 Проверка данных тем:');
      topics.forEach(topic => {
        console.log(` - "${topic.title}": ${topic.post_count} сообщений`);
      });

      res.json({ success: true, topics });

    } catch (error) {
      console.error('Ошибка получения тем:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить тему по ID
  static async getTopicById(req, res) {
    const { topicId } = req.params;
    let connection;
    
    try {
      connection = await getDbConnection();

      const [topics] = await connection.execute(`
        SELECT t.*, u.login as author_name, c.name as category_name, u.avatar as author_avatar
        FROM topics t
        JOIN users u ON t.author_id = u.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `, [topicId]);

      if (topics.length === 0) {
        return res.status(404).json({  success: false, message: "Тема не найдена" });
      }

      const [posts] = await connection.execute(`
        SELECT p.*, u.login as author_name, u.avatar as author_avatar
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.topic_id = ?
        ORDER BY p.created_at ASC
      `, [topicId]);

      console.log('📊 Тема найдена:', topics[0].title);
      console.log('📝 Сообщений в теме:', posts.length);

      res.json({
        success: true,
        topic: topics[0],
        posts
      });
    } catch (error) {
      console.error('❌ Ошибка получения темы:', error);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Добавить сообщение в тему
  static async addPostToTopic(req, res) {
    const { topicId } = req.params;
    const { content, authorId, parentPostId } = req.body;
    let connection;

    try {
      console.log('📨 Добавление сообщения в тему:', topicId);
      console.log('📦 Тело запроса:', req.body);

      if (!content || !authorId) {
        return res.status(400).json({
          success: false,
          message: "Сообщение не может быть пустым"
        });
      }

      connection = await getDbConnection();

      console.log('💾 Вставка сообщения в БД...');
      const [result] = await connection.execute(
        'INSERT INTO posts (content, author_id, topic_id, parent_post_id) VALUES (?, ?, ?, ?)',
        [content, authorId, topicId, parentPostId || null]
      );

      console.log('✅ Сообщение добавлено, ID:', result.insertId);

      const [newPosts] = await connection.execute(`
        SELECT 
          p.*,
          u.login as author_name,
          u.avatar as author_avatar
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
      `, [result.insertId]);

      const newPost = newPosts[0];

      await connection.execute(
        'UPDATE topics SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [topicId]
      );

      res.json({
        success: true,
        message: "Сообщение доставлено",
        post: newPost
      });
    } catch (error) {
      console.error("Ошибка добавления сообщения:", error);
      res.status(500).json({ success: false, message: "Ошибка добавления сообщения" });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Редактировать тему
  static async editTopic(req, res) {
    const { topicId } = req.params;
    const { title, content, authorId } = req.body;
    let connection;

    try {
      if (!title || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'Заголовок и содержание обязательны' 
        });
      }

      connection = await getDbConnection();

      // Проверяем что пользователь - автор темы
      const [topics] = await connection.execute(
        'SELECT author_id FROM topics WHERE id = ?',
        [topicId]
      );

      if (topics.length === 0) {
        return res.status(404).json({ success: false, message: 'Тема не найдена' });
      }

      if (topics[0].author_id !== parseInt(authorId)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      // Обновляем тему
      const [result] = await connection.execute(
        'UPDATE topics SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, topicId]
      );

      res.json({ 
        success: true, 
        message: 'Тема обновлена'
      });

    } catch (error) {
      console.error('Ошибка редактирования темы:', error);
      res.status(500).json({ success: false, message: 'Ошибка редактирования темы' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Получить реакции на пост
  static async getPostReactions(req, res) {
    const { postId } = req.params;
    
    let connection;
    try {
      connection = await getDbConnection();
      
      const [reactions] = await connection.execute(`
        SELECT 
          pr.*,
          u.login as user_name
        FROM post_reactions pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.post_id = ?
        ORDER BY pr.created_at DESC
      `, [postId]);
      
      const grouped = {};
      reactions.forEach(reaction => {
        if (!grouped[reaction.reaction_type]) {
          grouped[reaction.reaction_type] = [];
        }
        grouped[reaction.reaction_type].push(reaction);
      });
      
      res.json({ success: true, reactions: grouped });
      
    } catch (error) {
      console.error('Ошибка получения реакций:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }

  // Добавить/удалить реакцию
  static async handlePostReaction(req, res) {
    const { postId } = req.params;
    const { userId, reactionType } = req.body;
    
    let connection;
    try {
      connection = await getDbConnection();
      
      // Проверяем, есть ли уже такая реакция
      const [existing] = await connection.execute(
        'SELECT id FROM post_reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?',
        [postId, userId, reactionType]
      );
      
      if (existing.length > 0) {
        // Удаляем реакцию (отмена)
        await connection.execute(
          'DELETE FROM post_reactions WHERE id = ?',
          [existing[0].id]
        );
        res.json({ success: true, message: 'Реакция удалена', action: 'removed' });
      } else {
        // Удаляем другие реакции этого пользователя на этот пост
        await connection.execute(
          'DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        
        // Добавляем новую реакцию
        await connection.execute(
          'INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
          [postId, userId, reactionType]
        );
        res.json({ success: true, message: 'Реакция добавлена', action: 'added' });
      }
      
    } catch (error) {
      console.error('Ошибка обработки реакции:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    } finally {
      if (connection) await connection.end();
    }
  }
}

module.exports = ForumController;