const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
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
    origin: 'http://localhost:8080',
    credentials: true,
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
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

setupSocket(io);

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
server.listen(port, () => {
    console.log(`🚀 HTTP сервер запущен на порту ${port}`);
    console.log(`🔌 WebSocket сервер доступен на ws://localhost:${port}`);
    console.log(`🌐 Express API доступен на http://localhost:${port}`);
    console.log(`📁 Статические файлы: ${publicDir}`);
    console.log(`👤 Директория аватаров: ${avatarsDir}`);
    console.log(`⚙️  Режим: ${process.env.NODE_ENV || 'development'}`);
});