const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
} = require('../controllers/notification.controller');

// Get all notifications for current user
router.get('/', protect, getNotifications);

// Get unread notifications for current user
router.get('/unread', protect, getUnreadNotifications);

// Mark notification as read
router.patch('/:id/read', protect, markAsRead);

// Mark all notifications as read for current user
router.patch('/mark-all-read', protect, markAllAsRead);

// Clear all notifications for current user
router.delete('/clear-all', protect, clearAllNotifications);

module.exports = router; 