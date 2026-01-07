const express = require('express'); //библиотека для создания сервера
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise'); //библиотека для взаимодействия с бд
const bcrypt = require('bcryptjs'); //для безопасного хранения паролей
const nodemailer = require('nodemailer'); //даём возможность серверу отправлять письма на email
const cors = require('cors'); //разрешает фронтенду делать запросы к бэкенду
const jwt = require('jsonwebtoken');
require('dotenv').config();
const API_URL = 'http://localhost:3000';

const app = express(); //обрабатывает HTTP запросы (GET, POST и тд)
const port = process.env.port || 3000; //порт на котором работает сервер
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

console.log('🚀 Server.js ЗАПУЩЕН - поиск ошибки...');

app.use(cors({
    origin: 'http://localhost:8080', //разрешает запрос только с указанного источника
    credentials: true, //нужно для сохранения сессий, для автоматической отправки куков
    allowedHeaders: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.options('*', cors());

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        console.log('📨 Raw body length:', buf?.length);
    }
}));

app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const dbConfig = {
    host: 'localhost',
    user: 'forum_user', //пользователь mysql
    password: 'forum_pass', //пароль mysql
    database: 'forum_auth',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
};

require('dotenv').config({ 
    path: path.join(__dirname, '../.env') 
});

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔐 Проверка токена...');
    console.log('Заголовок Authorization:', authHeader ? 'есть' : 'нет');
    console.log('Токен:', token ? 'получен' : 'нет');
    
    if (!token) {
      console.log('❌ Токен не предоставлен');
      return res.status(401).json({ 
        success: false, 
        message: 'Требуется авторизация' 
      });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('❌ Ошибка проверки токена:', err.message);
        return res.status(403).json({ 
          success: false, 
          message: 'Неверный токен' 
        });
      }
      
      console.log('✅ Токен действителен, пользователь ID:', user.userId);
      req.user = user;
      next();
    });
    
  } catch (error) {
    console.error('❌ Ошибка в middleware:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
}

async function getDbConnection() { //ассинхронная функция для подключения к бд
    return await mysql.createConnection(dbConfig);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shadowroyaletv@gmail.com',
        pass: 'uxld hopx hwxh sqsz'
    }
});

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const avatarsDir = path.join(__dirname, 'public', 'assets', 'avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'), false);
    }
  }
});

app.post('/register', async (req, res) => {
    const { username, email, confirmEmail, password, confirmPassword } = req.body;
    let connection;

    try {
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "The passwords don't match" });
        }

        if (email !== confirmEmail) {
            return res.status(400).json({ message: "Email addresses do not match" })
        }

        connection = await getDbConnection();

        const [existingUsers] = await connection.execute(
            'SELECT * FROM users WHERE login = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "A user with this login or email already exists" });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const verificationCode = generateVerificationCode();

        const [result] = await connection.execute(
            'INSERT INTO users (login, email, password_hash, verification_code) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, verificationCode]
        );

        const mailOptions = {
            from: 'your.email@gmail.com',
            to: email,
            subject: 'Confirm registration',
            html: `<p>Your confirmation code: <b>${verificationCode}</b></p>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Confirmation code sent to ${email}: ${verificationCode}`);

        res.status(201).json({ message: "Registration successful! Check your email for confirmation" });

    } catch (error) {
        console.error("Registration error", error);
        res.status(500).json({ message: "An error occurred on the server" });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    let connection;

    try {

        if (!email || !code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Отсутствуют обязательные параметры: email и code' 
        });
        }

        connection = await getDbConnection();

        console.log('Попытка верификации:', { email, code });

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ? AND verification_code = ?',
            [email, code]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Incorrect confirmation code" });
        }

        console.log('Найдено пользователей:', users.length);

        if (users.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Неверный код подтверждения или email' 
            });
        }

        const user = users[0];

        await connection.execute(
            'UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = ?',
            [user.id]
        );

        console.log('Аккаунт подтвержден для пользователя:', user.email);

        res.json({ 
            success: true,
            message: 'Аккаунт успешно подтвержден!' 
        });

    } catch (error) {
        console.error('Error from confirmation:', error);
        res.status(500).json({ message: "An error occurred on the server" });
    } finally {
        if(connection) {
            await connection.end();
        }
    }
});

app.post("/api/login", async(req, res) => {
    const { login, password } = req.body;
    let connection;

    try {
        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message: 'Заполните все поля'
            });
        }

        connection = await getDbConnection();

        const [users] = await connection.execute(
            "SELECT * FROM users WHERE login = ? OR email = ?",
            [login, login] //ищем пользователя по логину или email
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не найден',
                errorType: 'user_not_found'
            });
        }

        const user = users[0];

        if(!user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email не подтверждён. Проверьте вашу почту.',
                errorType: 'email_not_verified',
                email: user.email
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Неверный пароль',
                errorType: 'invalid_password'
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                login: user.login,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Токен действует 7 дней
        );

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            token: token,
            user: {
                id: user.id,
                login: user.login,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch(error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка на сервере'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    let connection;

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email обязателен'
            });
        }

        connection = await getDbConnection;

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email уже подтверждён'
            });
        }

        const newVerificationCode = generateVerificationCode();

        await connection.execute(
            'UPDATE users SET verification_code = ? WHERE email = ?',
            [newVerificationCode, email]
        );

        const mailOptions = {
            from: 'shadowroyaletv@gmail.com',
            to: email,
            subject: 'Новый код подтверждения',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Новый код подтверждения</h2>
                    <p>Ваш новый код подтверждения: <strong style="font-size: 24px; color: #007bff;">${newVerificationCode}</strong></p>
                    <p>Или перейдите по ссылке:</p>
                    <a href="http://localhost:8080/verify?email=${encodeURIComponent(email)}&code=${newVerificationCode}" 
                        style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
                        Подтвердить аккаунт
                    </a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Новый код подтверждения отправлен на ${email}: ${newVerificationCode}`);

        res.json({
            success: true,
            message: "Новый код подтверждения отправлен на вашу почту"
        });

    } catch (error) {
        console.error("Ошибка при отправке кода:", error);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при отправке кода'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

const requireAuth = (req, res, next) => {
    //нужно будет добавить свою логику проверки JWT токена
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    req.userId = userId;
    next();
};

// Когда приходит запрос на /api/user/profile:
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  let connection;
  try {
  // 1. Получаем userId из query параметров
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Не авторизован' 
      });
    }

    console.log('🔄 Запрос профиля для ID:', userId);

    connection = await getDbConnection();

    const [users] = await connection.execute(
      'SELECT id, login, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    res.json({ success: true, user: users[0] });
   } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
   } finally {
    if (connection) await connection.end();
   }
});

app.post('/api/user/upload-avatar', upload.single('avatar'), async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Не авторизован' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Файл не загружен' });
  }

  let connection;
  try {
    connection = await getDbConnection();

    const [users] = await connection.execute(
      'SELECT avatar FROM users WHERE id = ?',
      [userId]
    );

    if (users.length > 0 && users[0].avatar) {
      const oldAvatar = users[0].avatar;
      
      // Проверяем, что это не дефолтная аватарка
      if (!oldAvatar.includes('/assets/images/poringAvatar.png') && 
          !oldAvatar.includes('poringAvatar')) {
        
        // Извлекаем имя файла
        let oldFilename;
        if (oldAvatar.includes('/assets/avatars/')) {
          oldFilename = oldAvatar.split('/').pop();
        } else if (oldAvatar.includes('localhost:3000')) {
          const url = new URL(oldAvatar);
          oldFilename = url.pathname.split('/').pop();
        }
        
        if (oldFilename) {
          const oldFilePath = path.join(__dirname, 'public', 'assets', 'avatars', oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('🗑️ Удален старый аватар:', oldFilename);
          }
        }
      }
    }

    // Генерируем URL для доступа к файлу
    const avatarUrl = `${API_URL}/assets/avatars/${req.file.filename}`;

    // Обновляем аватар в базе данных
    await connection.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, userId]
    );

    res.json({ 
      success: true, 
      message: 'Аватар успешно загружен', 
      avatarUrl: avatarUrl 
    });

  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    
    // Удаляем загруженный файл в случае ошибки
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, message: 'Ошибка загрузки аватара' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/user/remove-avatar', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Не авторизован' });
  }

  let connection;
  try {
    connection = await getDbConnection();

    // Получаем текущий аватар пользователя
    const [users] = await connection.execute(
      'SELECT avatar FROM users WHERE id = ?',
      [userId]
    );

    if (users.length > 0 && users[0].avatar) {
      const oldAvatar = users[0].avatar;
      console.log('🗑️ Удаляем аватар:', oldAvatar);
      
      // Извлекаем имя файла из URL
      let filename;
      if (oldAvatar.includes('/assets/avatars/')) {
        filename = oldAvatar.split('/').pop();
      } else if (oldAvatar.includes('localhost:3000')) {
        filename = oldAvatar.split('/').pop();
      }
      
      if (filename) {
        const filePath = path.join(__dirname, 'public', 'assets', 'avatars', filename);
        console.log('📁 Путь к файлу:', filePath);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Файл удален с диска');
        } else {
          console.log('⚠️ Файл не найден на диске');
        }
      }
    }

    // Обновляем базу данных - устанавливаем аватар в NULL
    await connection.execute(
      'UPDATE users SET avatar = NULL WHERE id = ?',
      [userId]
    );

    console.log('✅ Аватар удален из БД');

    res.json({ 
      success: true, 
      message: 'Аватар удален'
    });

  } catch (error) {
    console.error('❌ Ошибка удаления аватара:', error);
    res.status(500).json({ success: false, message: 'Ошибка удаления аватара' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/categories', async (req, res) => {
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
});

app.get('/api/categories/:categoryId', async (req, res) => {
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
});

app.post('/api/topics', async (req, res) => {
  console.log('🎯 /api/topics ВЫЗВАН');
  
  let connection;
  try {
    console.log('📨 Тело запроса:', req.body);
    
    const { title, content, categoryId, authorId } = req.body;
    
    // Проверка данных
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

    // Подключение к БД
    console.log('🔗 Подключение к БД...');
    connection = await getDbConnection();
    console.log('✅ Подключение к БД успешно');

    // ВСТАВКА ТЕМЫ В БД
    console.log('💾 Выполнение INSERT запроса...');
    const [result] = await connection.execute(
      'INSERT INTO topics (title, content, author_id, category_id) VALUES (?, ?, ?, ?)',
      [title, content, authorId, categoryId]
    );

    console.log('✅ Тема создана, ID:', result.insertId);

    // Возвращаем УСПЕШНЫЙ ответ
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
});

app.post('/api/debug-test', async (req, res) => {
  console.log('🧪 Тестовый эндпоинт вызван');
  
  try {
    const connection = await getDbConnection();
    
    // Простая вставка
    const [result] = await connection.execute(
      'INSERT INTO topics (title, content, author_id, category_id) VALUES (?, ?, ?, ?)',
      ['Тестовая тема', 'Тестовое содержание', 1, 11]
    );
    
    await connection.end();
    
    res.json({ 
      success: true, 
      message: 'Тест пройден',
      insertedId: result.insertId 
    });
    
  } catch (error) {
    console.error('❌ Тестовая ошибка:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Тест не пройден: ' + error.message 
    });
  }
});

app.get('/api/categories/:categoryId/topics', async (req, res) => {
  const { categoryId } = req.params;
  let connection;

  try {
    connection = await getDbConnection();

    // Сначала получаем основные данные тем
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

    // Затем для каждой темы получаем количество сообщений
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
});

app.get('/api/topics/:topicId', async (req, res) => {
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
});

app.post('/api/topics/:topicId/posts', async (req, res) => {
    const { topicId } = req.params;
    const {content, authorId, parentPostId} = req.body;
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
});

app.put('/api/topics/:topicId', async (req, res) => {
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
});

app.get('/api/posts/:postId/reactions', async (req, res) => {
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
});

app.post('/api/posts/:postId/reactions', async (req, res) => {
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
});

app.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();
    
    const [users] = await connection.execute(
      `SELECT id, login, email, avatar, created_at 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    res.json({ success: true, user: users[0] });

  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/users/:userId/posts', async (req, res) => {
  const { userId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();
    
    const [posts] = await connection.execute(
      `SELECT p.*, t.title as topic_title
       FROM posts p
       JOIN topics t ON p.topic_id = t.id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json({ success: true, posts });

  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/users/:userId/topics', async (req, res) => {
  const { userId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();
    
    const [topics] = await connection.execute(`
      SELECT 
        t.*,
        c.name as category_name,
        COUNT(p.id) as post_count
      FROM topics t
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN posts p ON t.id = p.topic_id
      WHERE t.author_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({ success: true, topics });

  } catch (error) {
    console.error('Ошибка получения тем:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Отправить запрос в друзья
app.post('/api/friends/request', async (req, res) => {
  const { userId, friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ success: false, message: 'Неверные данные' });
  }

  if (userId === friendId) {
    return res.status(400).json({ success: false, message: 'Нельзя добавить себя в друзья' });
  }

  let connection;
  try {
    connection = await getDbConnection();

    // Проверяем, существует ли уже запрос
    const [existing] = await connection.execute(
      `SELECT * FROM friendships 
       WHERE (user_id = ? AND friend_id = ?) 
          OR (user_id = ? AND friend_id = ?)`,
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      const status = existing[0].status;
      if (status === 'pending') {
        return res.json({ success: false, message: 'Запрос уже отправлен' });
      } else if (status === 'accepted') {
        return res.json({ success: false, message: 'Вы уже друзья' });
      } else if (status === 'blocked') {
        return res.json({ success: false, message: 'Пользователь заблокировал вас' });
      }
    }

    // Создаем запрос на дружбу
    await connection.execute(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
      [userId, friendId, 'pending']
    );

    res.json({ 
      success: true, 
      message: 'Запрос на дружбу отправлен' 
    });

  } catch (error) {
    console.error('Ошибка отправки запроса:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Принять/отклонить запрос в друзья
app.post('/api/friends/respond', async (req, res) => {
  const { userId, friendId, action } = req.body; // action: 'accept' или 'reject'

  if (!userId || !friendId || !action) {
    return res.status(400).json({ success: false, message: 'Неверные данные' });
  }

  let connection;
  try {
    connection = await getDbConnection();

    // Находим запрос
    const [requests] = await connection.execute(
      `SELECT * FROM friendships 
       WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
      [friendId, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Запрос не найден' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    
    // Обновляем статус запроса
    await connection.execute(
      'UPDATE friendships SET status = ? WHERE id = ?',
      [newStatus, requests[0].id]
    );

    // Если приняли в друзья, создаем обратную связь
    if (action === 'accept') {
      await connection.execute(
        'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
        [userId, friendId, 'accepted']
      );
    }

    res.json({ 
      success: true, 
      message: action === 'accept' ? 'Пользователь добавлен в друзья' : 'Запрос отклонен' 
    });

  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Получить список друзей
app.get('/api/friends/:userId', async (req, res) => {
  const { userId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();

    const [friends] = await connection.execute(`
      SELECT 
        u.id,
        u.login,
        u.avatar,
        u.email,
        f.created_at as friendship_date
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY f.updated_at DESC
    `, [userId]);

    res.json({ success: true, friends });

  } catch (error) {
    console.error('Ошибка получения друзей:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Получить входящие запросы на дружбу
app.get('/api/friends/requests/:userId', async (req, res) => {
  const { userId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();

    const [requests] = await connection.execute(`
      SELECT 
        f.id as request_id,
        u.id as user_id,
        u.login,
        u.avatar,
        u.email,
        f.created_at
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({ success: true, requests });

  } catch (error) {
    console.error('Ошибка получения запросов:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Отправить личное сообщение
app.post('/api/messages/send', async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !receiverId || !content?.trim()) {
    return res.status(400).json({ success: false, message: 'Неверные данные' });
  }

  // Проверяем, являются ли пользователи друзьями
  let connection;
  try {
    connection = await getDbConnection();

    const [friendship] = await connection.execute(
      `SELECT status FROM friendships 
       WHERE ((user_id = ? AND friend_id = ?) 
           OR (user_id = ? AND friend_id = ?))
         AND status = 'accepted'`,
      [senderId, receiverId, receiverId, senderId]
    );

    if (friendship.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Вы можете отправлять сообщения только друзьям' 
      });
    }

    // Сохраняем сообщение
    const [result] = await connection.execute(
      'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content.trim()]
    );

    // Получаем созданное сообщение с данными отправителя
    const [messages] = await connection.execute(`
      SELECT 
        pm.*,
        u.login as sender_name,
        u.avatar as sender_avatar
      FROM private_messages pm
      JOIN users u ON pm.sender_id = u.id
      WHERE pm.id = ?
    `, [result.insertId]);

    res.json({ 
      success: true, 
      message: 'Сообщение отправлено',
      message: messages[0]
    });

  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Получить диалог с пользователем
app.get('/api/messages/dialog/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();

    const [messages] = await connection.execute(`
      SELECT 
        pm.*,
        u.login as sender_name,
        u.avatar as sender_avatar,
        CASE 
          WHEN pm.sender_id = ? THEN 'outgoing'
          ELSE 'incoming'
        END as direction
      FROM private_messages pm
      JOIN users u ON pm.sender_id = u.id
      WHERE (pm.sender_id = ? AND pm.receiver_id = ?)
         OR (pm.sender_id = ? AND pm.receiver_id = ?)
      ORDER BY pm.created_at ASC
    `, [userId, userId, friendId, friendId, userId]);

    // Помечаем входящие сообщения как прочитанные
    await connection.execute(
      'UPDATE private_messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
      [userId, friendId]
    );

    res.json({ success: true, messages });

  } catch (error) {
    console.error('Ошибка получения диалога:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

// Получить список диалогов
app.get('/api/messages/conversations/:userId', async (req, res) => {
  const { userId } = req.params;

  let connection;
  try {
    connection = await getDbConnection();

    const [conversations] = await connection.execute(`
      SELECT 
        u.id as friend_id,
        u.login as friend_name,
        u.avatar as friend_avatar,
        pm.content as last_message,
        pm.created_at as last_message_time,
        pm.is_read,
        COUNT(CASE WHEN pm.is_read = FALSE AND pm.receiver_id = ? THEN 1 END) as unread_count
      FROM users u
      INNER JOIN (
        SELECT 
          CASE 
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END as friend_id,
          MAX(created_at) as max_time
        FROM private_messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE 
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END
      ) last_msgs ON u.id = last_msgs.friend_id
      INNER JOIN private_messages pm ON (
        (pm.sender_id = ? AND pm.receiver_id = u.id) OR 
        (pm.sender_id = u.id AND pm.receiver_id = ?)
      ) AND pm.created_at = last_msgs.max_time
      WHERE u.id != ?
      ORDER BY pm.created_at DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    res.json({ success: true, conversations });

  } catch (error) {
    console.error('Ошибка получения диалогов:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    if (connection) await connection.end();
  }
});

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Новое подключение:', socket.id);

  socket.on('authenticate', (userId) => {
    console.log(`👤 Аутентификация: ${userId}`);
    onlineUsers.set(userId.toString(), socket.id);
    socket.userId = userId;
    socket.emit('authenticated', { success: true });
  });

  socket.on('sendMessage', async (data) => {
    console.log('📤 Сообщение через WebSocket:', data);
    
    const { senderId, receiverId, content } = data;
    
    let connection;
    try {
      connection = await getDbConnection();

      // Сохраняем в БД
      const [result] = await connection.execute(
        'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [senderId, receiverId, content]
      );

      // Получаем данные сообщения
      const [messages] = await connection.execute(`
        SELECT 
          pm.*, 
          u.login as sender_name, 
          u.avatar as sender_avatar,
          ur.login as receiver_name,
          ur.avatar as receiver_avatar
        FROM private_messages pm
        JOIN users u ON pm.sender_id = u.id
        JOIN users ur ON pm.receiver_id = ur.id
        WHERE pm.id = ?
    `, [result.insertId]);

      const message = messages[0];

      const messageData = {
        ...message,
        // Добавляем информацию об участниках
        participants: {
          sender: {
            id: message.sender_id,
            name: message.sender_name,
            avatar: message.sender_avatar
          },
          receiver: {
            id: message.receiver_id,
            name: message.receiver_name,
            avatar: message.receiver_avatar
          }
        }
      };
      
      // Отправляем отправителю
      const senderSocketId = onlineUsers.get(senderId.toString());

      if (senderSocketId) {
          io.to(senderSocketId).emit('newMessage', {
            ...messageData,
            // Для отправителя сообщение исходящее
            direction: 'outgoing'
          });
          console.log(`📨 Сообщение отправлено обратно отправителю ${senderId}`);
      }

      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', {
          ...messageData,
          // Для получателя сообщение входящее
          direction: 'incoming'
        });
        console.log(`📨 Сообщение доставлено получателю ${receiverId}`);
      }

      // Обновляем списки диалогов
      updateConversations(senderId, receiverId);

    } catch (error) {
      console.error('❌ Ошибка:', error);
      socket.emit('messageError', 'Ошибка сервера');
    } finally {
      if (connection) await connection.end();
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Отключение:', socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId.toString());
    }
  });
});

function updateConversations(userId1, userId2) {
  const socketId1 = onlineUsers.get(userId1.toString());
  const socketId2 = onlineUsers.get(userId2.toString());
  
  if (socketId1) io.to(socketId1).emit('updateConversations');
  if (socketId2) io.to(socketId2).emit('updateConversations');
}

app.use((error, req, res, next) => {
  console.error('🚨 ГЛОБАЛЬНАЯ ОШИБКА:', error);
  console.error('🚨 Stack trace:', error.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Ошибка сервера: ' + error.message
  });
});

app.use((error, req, res, next) => {
  console.error('🚨 Глобальная ошибка:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Внутренняя ошибка сервера',
    error: error.message 
  });
});

app.use(express.static('public'));

server.listen(port, () => {
    console.log(`🚀 HTTP сервер запущен на порту ${port}`);
  console.log(`🔌 WebSocket сервер доступен на ws://localhost:${port}`);
  console.log(`🌐 Express API доступен на http://localhost:${port}`)
});
