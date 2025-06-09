const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: {
      values: ['High_Severity_Report', 'New_Message', 'Report_Status_Change'],
      message: 'Type must be High_Severity_Report, New_Message, or Report_Status_Change'
    },
    required: [true, 'Notification type is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  is_read: {
    type: Boolean,
    default: false
  },
  related_report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null // Only set for report-related notifications
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
notificationSchema.index({ user_id: 1, createdAt: -1 });
notificationSchema.index({ is_read: 1 });
notificationSchema.index({ type: 1 });

// Virtual to check if notification is still active (within 2 weeks)
notificationSchema.virtual('isActive').get(function() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return this.createdAt > twoWeeksAgo;
});

// Static method to get active notifications for a user (within 2 weeks)
notificationSchema.statics.getActiveNotifications = function(userId) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return this.find({ 
    user_id: userId, 
    createdAt: { $gt: twoWeeksAgo } 
  })
    .populate('related_report', 'building_name room status')
    .sort({ createdAt: -1 });
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return this.countDocuments({ 
    user_id: userId, 
    is_read: false,
    createdAt: { $gt: twoWeeksAgo } 
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.is_read = true;
  return this.save();
};

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);