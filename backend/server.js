const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Импорт конфигураций
const { setupSocket } = require('./config/socket');

// Импорт маршрутов
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const forumRoutes = require('./routes/forumRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');

const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://messenger-9df79.web.app', //поменять на домен firebase
    'https://ваш-проект.firebaseapp.com', //альтернативный firebase
    'https://*.serveousercontent.com',
    'https://b87bdc3c9d3d92e2-178-64-100-169.serveousercontent.com',
    'https://localhost:8080',  
    'http://localhost',
    // Добавьте сюда ваш ngrok адрес когда получите его:
    'https://abc123.ngrok.io',                  // ← ваш ngrok адрес
    'https://*.ngrok.io',                       // любые ngrok субдомены
    'https://*.ngrok-free.app'                  // новые бесплатные ngrok домены
]

const app = express();
const port = process.env.PORT || 3000;

// Создаем необходимые директории
const publicDir = path.join(__dirname, 'public');
const avatarsDir = path.join(publicDir, 'assets', 'avatars');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения, curl)
    if (!origin) {
      console.log('🟡 Запрос без Origin header');
      return callback(null, true);
    }
    
    // Проверяем в списке разрешенных
    if (allowedOrigins.some(allowed => {
      // Проверка точного совпадения
      if (allowed === origin) return true;
      // Проверка с подстановочными знаками (*.ngrok.io)
      if (allowed.includes('*')) {
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return false;
    })) {
      console.log(`✅ Разрешен Origin: ${origin}`);
      return callback(null, true);
    }
    
    // Если origin не разрешен
    console.log(`❌ Заблокирован Origin: ${origin}`);
    console.log(`ℹ️  Разрешенные origins:`, allowedOrigins);
    return callback(new Error(`CORS: Origin ${origin} не разрешен`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 часа кеширования preflight
}));

app.options('*', cors());

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        console.log('📨 Raw body length:', buf?.length);
    }
}));

app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(publicDir));
app.use('/assets', express.static(path.join(publicDir, 'assets')));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

// Создание HTTP сервера
const server = http.createServer(app);

// Настройка WebSocket
const io = socketIo(server, {
    cors: {
        origin: function(origin, callback) {
            // Та же логика, что и для Express
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.some(allowed => {
                if (allowed === origin) return true;
                if (allowed.includes('*')) {
                    const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
                    return regex.test(origin);
                }
                return false;
            })) {
                return callback(null, true);
            }
            
            return callback(new Error('CORS не разрешен для Socket.io'), false);
        },
        credentials: true,
        methods: ["GET", "POST"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

setupSocket(io);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'Forum Backend',
    version: '1.0.0'
  });
});

app.get('/api/ip', (req, res) => {
  res.json({
    ip: req.ip,
    headers: req.headers
  });
});

// Обработка 404
app.use((req, res) => {
    console.log(`❌ Маршрут не найден: ${req.method} ${req.url}`);
    res.status(404).json({ 
        success: false, 
        message: 'Маршрут не найден' 
    });
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('🚨 Глобальная ошибка:', error);
    console.error('🚨 Stack trace:', error.stack);
    
    res.status(500).json({ 
        success: false, 
        message: 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Запуск сервера
server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log(`🚀 HTTP сервер запущен на порту ${port}`);
    console.log(`🔌 WebSocket сервер доступен на ws://localhost:${port}`);
    console.log(`🌐 Express API доступен на http://localhost:${port}`);
    console.log(`📁 Статические файлы: ${publicDir}`);
    console.log(`👤 Директория аватаров: ${avatarsDir}`);
    console.log(`⚙️  Режим: ${process.env.NODE_ENV || 'development'}`);
});