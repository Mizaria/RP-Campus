// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Import routes
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const adminTaskRoutes = require('./routes/adminTask.routes');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/message.routes');
const announcementRoutes = require('./routes/announcement.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');

// Import ChatServer for real-time messaging
const ChatServer = require('./socket/chat.server');

// Import announcement scheduler
const { scheduleAnnouncementCleanup } = require('./services/announcementScheduler');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:4000'], // Allow both frontend and any other origins
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Add this line
    next();
  }, express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin-tasks', adminTaskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/announcements', announcementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve static files only in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from React app build
    app.use(express.static(path.join(__dirname, '../public')));
    
    // Serve index.html for all non-API routes (SPA support)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
} else {
    // In development, just return a simple message for non-API routes
    app.get('*', (req, res) => {
        res.json({ 
            message: 'Backend API is running', 
            environment: 'development',
            timestamp: new Date().toISOString()
        });
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Initialize ChatServer for real-time messaging
const chatServer = new ChatServer(server);
console.log('✅ Chat Server initialized');

// Make chatServer globally accessible for other modules
global.chatServer = chatServer;

// Initialize announcement cleanup scheduler
try {
    scheduleAnnouncementCleanup();
} catch (error) {
    console.log('⚠️ Announcement scheduler not available (node-cron not installed). TTL index will handle cleanup.');
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connection Successful!'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Close server & exit process
    process.exit(1);
}); 