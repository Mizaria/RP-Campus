const mongoose = require('mongoose');

const adminTaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Task description is required'],
        trim: true
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: [true, 'Report ID is required']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Assigned user is required']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    completedAt: {
        type: Date
    },
    notes: [{
        text: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
adminTaskSchema.index({ reportId: 1 });
adminTaskSchema.index({ assignedTo: 1 });
adminTaskSchema.index({ status: 1 });
adminTaskSchema.index({ priority: 1 });
adminTaskSchema.index({ dueDate: 1 });

// Static method to get tasks by status
adminTaskSchema.statics.getTasksByStatus = async function(status) {
    return this.find({ status }).populate('assignedTo', 'username name email');
};

// Static method to get tasks by assigned user
adminTaskSchema.statics.getTasksByUser = async function(userId) {
    return this.find({ assignedTo: userId }).populate('reportId', 'description category');
};

// Static method to get overdue tasks
adminTaskSchema.statics.getOverdueTasks = async function() {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $ne: 'Completed' }
    }).populate('assignedTo', 'username name email');
};

const AdminTask = mongoose.model('AdminTask', adminTaskSchema);

module.exports = AdminTask; 