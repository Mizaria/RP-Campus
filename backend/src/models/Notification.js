const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: [true, 'Report ID is required']
    },
    type: {
        type: String,
        enum: ['status_change','priority_change'],
        required: [true, 'Notification type is required']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    statusData: {
        newStatus: String,
        newPriority: String,
        previousStatus: String,
        previousPriority: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ reportId: 1 });

// Static method to get user's unread notifications
notificationSchema.statics.getUnreadNotifications = function(userId) {
    return this.find({ userId, isRead: false })
        .populate('reportId', 'category status')
        .sort({ createdAt: -1 });
};

// Static method to get user's all notifications
notificationSchema.statics.getUserNotifications = function(userId) {
    return this.find({ userId })
        .populate('reportId', 'category status')
        .sort({ createdAt: -1 });
};

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema); 