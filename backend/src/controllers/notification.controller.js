const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/async');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
    console.log('[NOTIFICATIONS DEBUG] Getting notifications for user:', req.user.id);
    
    const notifications = await Notification.getUserNotifications(req.user.id);
    
    console.log('[NOTIFICATIONS DEBUG] Found', notifications.length, 'notifications for user');
    notifications.forEach((notif, index) => {
        console.log(`[NOTIFICATIONS DEBUG] Notification ${index + 1}:`, {
            id: notif._id,
            type: notif.type,
            message: notif.message,
            isRead: notif.isRead,
            createdAt: notif.createdAt,
            reportId: notif.reportId?._id,
            reportStatus: notif.reportId?.status,
            statusData: notif.statusData
        });
    });

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

// @desc    Create a notification (internal use - not an Express route handler)
// @access  Private
exports.createNotification = async (userId, reportId, type, message, statusData = {}) => {
    console.log('[NOTIFICATION DEBUG] createNotification called with:', { 
        userId: userId?.toString(), 
        reportId: reportId?.toString(), 
        type, 
        message,
        statusData
    });

    // Validate all required fields
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!reportId) missingFields.push('reportId');
    if (!type) missingFields.push('type');
    if (!message) missingFields.push('message');

    if (missingFields.length > 0) {
        console.error('[NOTIFICATION ERROR] Notification creation failed: missing required fields:', missingFields);
        throw new AppError(`Missing required fields for notification: ${missingFields.join(', ')}`, 400);
    }

    // Ensure message is a non-empty string
    const messageStr = String(message).trim();
    if (!messageStr) {
        console.error('[NOTIFICATION ERROR] Notification creation failed: message is empty after trimming');
        throw new AppError('Notification message cannot be empty', 400);
    }

    console.log('[NOTIFICATION DEBUG] About to create notification in database...');
    
    const notificationData = {
        userId,
        reportId,
        type,
        message: messageStr
    };

    // Add status data if provided (this will work even if schema doesn't have it yet)
    if (statusData && Object.keys(statusData).length > 0) {
        try {
            notificationData.statusData = statusData;
            console.log('[NOTIFICATION DEBUG] Added statusData to notification:', statusData);
        } catch (statusDataError) {
            console.warn('[NOTIFICATION WARNING] Could not add statusData, using message only:', statusDataError.message);
            // Continue without statusData - message parsing will handle it
        }
    }
    
    let notification;
    try {
        notification = await Notification.create(notificationData);
        console.log('[NOTIFICATION DEBUG] Notification created successfully in database with statusData');
    } catch (createError) {
        // If statusData field doesn't exist in schema, create without it
        if (createError.message.includes('statusData') || createError.name === 'ValidationError') {
            console.warn('[NOTIFICATION WARNING] Creating notification without statusData due to schema issue');
            const fallbackData = {
                userId,
                reportId,
                type,
                message: messageStr
            };
            notification = await Notification.create(fallbackData);
            console.log('[NOTIFICATION DEBUG] Notification created successfully without statusData - will use message parsing');
        } else {
            throw createError;
        }
    }

    console.log('[NOTIFICATION DEBUG] Final notification created:', {
        id: notification._id,
        userId: notification.userId,
        reportId: notification.reportId,
        type: notification.type,
        messageLength: notification.message.length,
        hasStatusData: !!notification.statusData,
        statusData: notification.statusData,
        createdAt: notification.createdAt
    });
    
    return notification;
}; 