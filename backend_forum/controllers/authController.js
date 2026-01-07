const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDbConnection } = require('../config/database');
const { generateVerificationCode } = require('../utils/helpers');
const emailService = require('../services/emailService');

class AuthController {
  static async register(req, res) {
    const { username, email, confirmEmail, password, confirmPassword } = req.body;
    let connection;

    try {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "The passwords don't match" });
      }

      if (email !== confirmEmail) {
        return res.status(400).json({ message: "Email addresses do not match" });
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

      // Отправляем email с кодом подтверждения
      await emailService.sendVerificationEmail(email, verificationCode);

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
  }

  static async verify(req, res) {
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
  }

  static async login(req, res) {
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
        [login, login]
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
        { expiresIn: '7d' }
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
  }

  static async resendVerification(req, res) {
    const { email } = req.body;
    let connection;

    try {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email обязателен'
        });
      }

      connection = await getDbConnection();

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

      await emailService.sendVerificationEmail(email, newVerificationCode);

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
  }
}

module.exports = AuthController;