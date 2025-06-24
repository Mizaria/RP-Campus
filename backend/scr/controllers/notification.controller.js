const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/async');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
    const notifications = await Notification.getUserNotifications(req.user.id);

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications
    });
});

// @desc    Get unread notifications for current user
// @route   GET /api/notifications/unread
// @access  Private
exports.getUnreadNotifications = asyncHandler(async (req, res, next) => {
    const notifications = await Notification.getUnreadNotifications(req.user.id);

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications
    });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        return next(new AppError('Notification not found', 404));
    }

    // Check if user owns the notification
    if (notification.userId.toString() !== req.user.id) {
        return next(new AppError('Not authorized to access this notification', 403));
    }

    await notification.markAsRead();

    res.status(200).json({
        success: true,
        data: notification
    });
});

// @desc    Create a notification (internal use)
// @access  Private
exports.createNotification = asyncHandler(async (userId, reportId, type, message) => {
    console.log('createNotification called with:', { 
        userId: userId?.toString(), 
        reportId: reportId?.toString(), 
        type, 
        message 
    });

    // Validate all required fields
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!reportId) missingFields.push('reportId');
    if (!type) missingFields.push('type');
    if (!message) missingFields.push('message');

    if (missingFields.length > 0) {
        console.error('Notification creation failed: missing required fields:', missingFields);
        throw new AppError(`Missing required fields for notification: ${missingFields.join(', ')}`, 400);
    }

    // Ensure message is a non-empty string
    const messageStr = String(message).trim();
    if (!messageStr) {
        console.error('Notification creation failed: message is empty after trimming');
        throw new AppError('Notification message cannot be empty', 400);
    }

    const notification = await Notification.create({
        userId,
        reportId,
        type,
        message: messageStr
    });

    console.log('Notification created successfully:', {
        id: notification._id,
        userId: notification.userId,
        type: notification.type,
        messageLength: notification.message.length
    });
    
    return notification;
}); 