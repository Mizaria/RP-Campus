const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    commentText: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        minlength: [1, 'Comment cannot be empty']
    },
    photoUrl: {
        type: String
    }
}, {
    timestamps: true
});

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter ID is required']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [commentSchema],
    category: {
        type: String,
        enum: ['Electrical', 'Plumbing', 'IT', 'Furniture', 'Equipment', 'Sanitation'],
        required: [true, 'Category is required']
    },
    priority: {
        type: String,
        enum: ['Low', 'High'],
        required: [true, 'Priority is required']
    },
    photoUrl: {
        type: String
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Cancelled'],
        default: 'Pending'
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    building: {
        type: String,
        required: [true, 'Building is required'],
        trim: true
    },
    room: {
        type: String,
        required: [true, 'Room is required'],
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ category: 1 });

// Virtual for getting report age
reportSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if report can be updated
reportSchema.methods.canBeUpdated = function() {
    return this.status === 'Pending';
};

// Static method to get reports by status
reportSchema.statics.getByStatus = function(status) {
    return this.find({ status })
        .populate('reporter', 'username email role')
        .sort({ createdAt: -1 });
};

// Static method to get reports by category
reportSchema.statics.getByCategory = function(category) {
    return this.find({ category })
        .populate('reporter', 'username email role')
        .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Report', reportSchema); 