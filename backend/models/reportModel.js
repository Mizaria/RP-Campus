const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reportSchema = new Schema({
  buildingName: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['Low', 'High'],
    default: 'Low'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Resolved'],
    default: 'Pending'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminRemarks: {
    type: String,
    trim: true
  },
  fixImage: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Middleware to prevent status changes after resolution
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Resolved') {
    this.resolvedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);