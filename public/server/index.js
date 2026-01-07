require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Генерация кода подтверждения
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===== API ROUTES ===== //

// 1. Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, confirmEmail, password } = req.body;

    // Валидация
    if (email !== confirmEmail) {
      return res.status(400).json({ error: 'Email адреса не совпадают' });
    }

    // Проверка существования пользователя
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();

    // Сохранение пользователя
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, verification_code, verification_code_expires) 
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour') RETURNING id, username, email`,
      [username, email, hashedPassword, verificationCode]
    );

    // В development режиме показываем код в консоли
    console.log(`Код подтверждения для ${email}: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      message: 'Код подтверждения отправлен',
      userId: result.rows[0].id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Подтверждение email
app.post('/api/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_code = NULL,
           verification_code_expires = NULL
       WHERE id = $1 AND verification_code = $2 
       AND verification_code_expires > NOW()
       RETURNING *`,
      [userId, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный или просроченный код' });
    }

    res.json({ success: true, message: 'Email успешно подтвержден' });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. Вход
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Поиск пользователя
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const user = result.rows[0];

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    // Проверка верификации
    if (!user.email_verified) {
      return res.status(400).json({ 
        error: 'Email не подтвержден', 
        needsVerification: true,
        userId: user.id
      });
    }

    // Успешный вход
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_code VARCHAR(6),
        verification_code_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Таблица users готова к работе');
  } catch (error) {
    console.error('Ошибка создания таблицы:', error);
  }
};


initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Сервер запущен на порту ${PORT}`);
      console.log(`📍 API доступно по: http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Не удалось запустить сервер:', error);
    process.exit(1);
  });


