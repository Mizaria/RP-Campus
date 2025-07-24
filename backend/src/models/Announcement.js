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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required']
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Set expiry to 2 weeks from creation
            return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        },
        index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic deletion
    }
}, {
    timestamps: true
});

// Index for better query performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ createdBy: 1 });

// Virtual to check if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
    return this.expiresAt < new Date();
});

// Ensure virtual fields are serialized
announcementSchema.set('toJSON', { virtuals: true });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
