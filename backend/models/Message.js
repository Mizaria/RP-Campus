const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required']
  },
  content_text: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  content_image_url: {
    type: String,
    default: null // Optional image attachment
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
messageSchema.index({ sender_id: 1, receiver_id: 1, timestamp: -1 });
messageSchema.index({ receiver_id: 1, is_read: 1 });
messageSchema.index({ timestamp: -1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50) {
  return this.find({
    $or: [
      { sender_id: userId1, receiver_id: userId2 },
      { sender_id: userId2, receiver_id: userId1 }
    ]
  })
    .populate('sender_id', 'first_name last_name profile_picture role')
    .populate('receiver_id', 'first_name last_name profile_picture role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get unread messages count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    receiver_id: userId, 
    is_read: false 
  });
};

// Static method to get all conversations for a user (list of people they've chatted with)
messageSchema.statics.getUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender_id: new mongoose.Types.ObjectId(userId) },
          { receiver_id: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$sender_id", new mongoose.Types.ObjectId(userId)] },
            then: "$receiver_id",
            else: "$sender_id"
          }
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$receiver_id", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$is_read", false] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $project: {
        _id: 1,
        user: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          profile_picture: 1,
          role: 1
        },
        lastMessage: 1,
        unreadCount: 1
      }
    },
    {
      $sort: { "lastMessage.timestamp": -1 }
    }
  ]);
};

// Instance method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.is_read = true;
  return this.save();
};

// Static method to mark all messages as read in a conversation
messageSchema.statics.markConversationAsRead = function(senderId, receiverId) {
  return this.updateMany(
    { 
      sender_id: senderId, 
      receiver_id: receiverId, 
      is_read: false 
    },
    { is_read: true }
  );
};

module.exports = mongoose.model('Message', messageSchema);