const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { 
    getUsersForMessages, 
    getMessagesForUser, 
    sendMessage,
    markMessageAsRead,
    getUnreadMessageCount
} = require('../controllers/message.controller');

// Configure multer for message image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../../uploads');
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'message-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get unread message count for current user (must be before /:id route)
router.get('/unread/count', protect, getUnreadMessageCount);

// Get all users available for messaging (excluding current user)
router.get('/users', protect, getUsersForMessages);

// Get messages between current user and specific user
router.get('/:id', protect, getMessagesForUser);

// Send a message to a specific user (with optional image upload)
router.post('/send/:id', protect, upload.single('image'), sendMessage);

// Mark a specific message as read
router.patch('/:messageId/read', protect, markMessageAsRead);

module.exports = router;