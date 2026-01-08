const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

admin.initializeApp();

const app = express();

const allowedOrigins = [
    'https://messenger-9df79.web.app',
    'http://localhost:8080'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const forumRoutes = require('./routes/forumRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'Firebase Cloud Functions',
        version: '1.0.0'
    });
});

exports.api = functions.https.onRequest(app);