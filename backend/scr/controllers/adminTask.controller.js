const AdminTask = require('../models/AdminTask');
const Report = require('../models/Report');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/async');

// @desc    Create a new admin task
// @route   POST /api/admin-tasks
// @access  Private/Admin
exports.createTask = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    // Check if report exists
    const report = await Report.findById(req.body.reportId);
    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    const task = await AdminTask.create(req.body);

    res.status(201).json({
        success: true,
        data: task
    });
});

// @desc    Get all admin tasks
// @route   GET /api/admin-tasks
// @access  Private/Admin
exports.getTasks = asyncHandler(async (req, res, next) => {
    const tasks = await AdminTask.find()
        .populate('reportId', 'description category')
        .populate('assignedTo', 'username name email')
        .populate('createdBy', 'username name');

    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});

// @desc    Get single admin task
// @route   GET /api/admin-tasks/:id
// @access  Private/Admin
exports.getTask = asyncHandler(async (req, res, next) => {
    const task = await AdminTask.findById(req.params.id)
        .populate('reportId', 'description category')
        .populate('assignedTo', 'username name email')
        .populate('createdBy', 'username name');

    if (!task) {
        return next(new AppError('Task not found', 404));
    }

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Delete admin task
// @route   DELETE /api/admin-tasks/:id
// @access  Private/Admin
exports.deleteTask = asyncHandler(async (req, res, next) => {
    const task = await AdminTask.findById(req.params.id);

    if (!task) {
        return next(new AppError('Task not found', 404));
    }

    await AdminTask.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get tasks by status
// @route   GET /api/admin-tasks/status/:status
// @access  Private/Admin
exports.getTasksByStatus = asyncHandler(async (req, res, next) => {
    const tasks = await AdminTask.getTasksByStatus(req.params.status);

    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});

// @desc    Get tasks by assigned user
// @route   GET /api/admin-tasks/user/:userId
// @access  Private/Admin
exports.getTasksByUser = asyncHandler(async (req, res, next) => {
    const tasks = await AdminTask.getTasksByUser(req.params.userId);

    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});

// @desc    Get overdue tasks
// @route   GET /api/admin-tasks/overdue
// @access  Private/Admin
exports.getOverdueTasks = asyncHandler(async (req, res, next) => {
    const tasks = await AdminTask.getOverdueTasks();

    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});

// @desc    Add note to task
// @route   POST /api/admin-tasks/:id/notes
// @access  Private/Admin
exports.addTaskNote = asyncHandler(async (req, res, next) => {
    const task = await AdminTask.findById(req.params.id);

    if (!task) {
        return next(new AppError('Task not found', 404));
    }

    task.notes.push({
        text: req.body.text,
        createdBy: req.user.id
    });

    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Update task status
// @route   PATCH /api/admin-tasks/:id/status
// @access  Private/Admin
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
    const task = await AdminTask.findById(req.params.id);

    if (!task) {
        return next(new AppError('Task not found', 404));
    }

    // Validate status
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(req.body.status)) {
        return next(new AppError(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    // If task is being marked as completed, set completedAt
    if (req.body.status === 'Completed' && task.status !== 'Completed') {
        task.completedAt = Date.now();
    }

    // If task is being marked as cancelled, validate it's not already completed
    if (req.body.status === 'Cancelled' && task.status === 'Completed') {
        return next(new AppError('Cannot cancel a completed task', 400));
    }

    task.status = req.body.status;
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
}); 