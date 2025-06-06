const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const chatSchema = new Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [messageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastMessage timestamp when new message is added
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastMessage = Date.now();
  }
  next();
});

// Ensure chat is between admin and student/staff only
chatSchema.pre('save', async function(next) {
  if (this.isModified('participants')) {
    const User = mongoose.model('User');
    const users = await User.find({ _id: { $in: this.participants } });
    
    if (users.length !== 2) {
      next(new Error('Chat must have exactly 2 participants'));
    }
    
    const hasAdmin = users.some(user => user.role === 'admin');
    const hasNonAdmin = users.some(user => ['student', 'staff'].includes(user.role));
    
    if (!hasAdmin || !hasNonAdmin) {
      next(new Error('Chat must be between an admin and a student/staff'));
    }
  }
  next();
});

module.exports = mongoose.model('Chat', chatSchema);