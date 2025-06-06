const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const announcementSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 14); // 2 weeks from creation
      return date;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware to check if announcement has expired
announcementSchema.pre('find', function() {
  this.where({ 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
});

module.exports = mongoose.model('Announcement', announcementSchema);