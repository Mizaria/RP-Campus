const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Announcement creator is required']
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ created_by: 1 });

// Virtual to check if announcement is still active (within 2 weeks)
announcementSchema.virtual('isActive').get(function() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return this.createdAt > twoWeeksAgo;
});

// Static method to get active announcements (within 2 weeks)
announcementSchema.statics.getActiveAnnouncements = function() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return this.find({ createdAt: { $gt: twoWeeksAgo } })
    .populate('created_by', 'first_name last_name role')
    .sort({ createdAt: -1 });
};

// Ensure virtual fields are serialized
announcementSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Announcement', announcementSchema);