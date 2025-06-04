require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');

// Initialize Express
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploads directory static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/chat', require('./routes/chat'));

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join private room for notifications
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  // Handle chat messages
  socket.on('sendMessage', (data) => {
    io.to(data.recipientId).emit('message', {
      senderId: data.senderId,
      content: data.content
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { createUploadDirs } = require('./utils/helpers');

// Create upload directories
createUploadDirs();

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});