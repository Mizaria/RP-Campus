const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getNotifications,
    getUnreadNotifications,
    markAsRead
} = require('../controllers/notification.controller');

// Get all notifications for current user
router.get('/', protect, getNotifications);

// Get unread notifications for current user
router.get('/unread', protect, getUnreadNotifications);

// Mark notification as read
router.patch('/:id/read', protect, markAsRead);

module.exports = router; 