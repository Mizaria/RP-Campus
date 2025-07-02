const Report = require('../models/Report');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');
const AdminTask = require('../models/AdminTask');
const asyncHandler = require('../middleware/async');
const { createNotification } = require('./notification.controller');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private (students and staff)
exports.createReport = asyncHandler(async (req, res, next) => {
    console.log('Creating report with request body:', req.body);
    console.log('File upload:', req.file);

    // Add user to req.body
    req.body.reporter = req.user.id;
    req.body.status = 'Pending'; // Initial status

    // Handle file upload if present
    if (req.file) {
        try {
            console.log('Processing file upload:', req.file);
            await fileService.validateFile(req.file);
            const photoUrl = fileService.getFileUrl(req.file.filename);
            console.log('Generated photo URL:', photoUrl);
            req.body.photoUrl = photoUrl;
        } catch (error) {
            console.error('File upload error:', error);
            // Return a user-friendly error message
            return res.status(error.statusCode || 400).json({
                status: 'error',
                message: error.message || 'Invalid file upload.'
            });
        }
    }

    console.log('Creating report with data:', req.body);
    const report = await Report.create(req.body);
    console.log('Created report:', report);

    // Find an admin user to notify
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
        // Format the notification message
        const notificationMessage = `New ${report.category} report submitted: ${report.description.substring(0, 50)}${report.description.length > 50 ? '...' : ''}`;
        
        console.log('Creating notification with:', {
            userId: adminUser._id,
            reportId: report._id,
            type: 'acknowledgment',
            message: notificationMessage
        });

        try {
            // Create notification for admin
            const notification = await createNotification(
                adminUser._id,
                report._id,
                'acknowledgment',
                notificationMessage
            );
            console.log('Notification created:', notification._id);
        } catch (error) {
            console.error('Failed to create notification:', error);
            // Don't fail the report creation if notification fails
        }
    }

    res.status(201).json({
        success: true,
        data: report
    });
});

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private/Admin
exports.getReports = asyncHandler(async (req, res, next) => {
    const reports = await Report.find()
        .populate('reporter', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('comments.userId', 'username name email')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
    });
});

// @desc    Get user's reports
// @route   GET /api/reports/user/me
// @access  Private
exports.getUserReports = asyncHandler(async (req, res, next) => {
    const reports = await Report.find({ reporter: req.user.id })
        .populate('assignedTo', 'username name email')
        .populate('comments.userId', 'username name email')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
    });
});

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
exports.getReport = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id)
        .populate('reporter', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('comments.userId', 'username name email');

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    // Check if user is authorized to view this report
    if (req.user.role !== 'admin' && report.reporter._id.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to access this report', 403));
    }

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    // Handle file upload if present
    let photoUrl;
    if (req.file) {
        try {
            await fileService.validateFile(req.file);
            photoUrl = fileService.getFileUrl(req.file.filename);
        } catch (error) {
            console.error('File upload error:', error);
            // Return a user-friendly error message
            return res.status(error.statusCode || 400).json({
                status: 'error',
                message: error.message || 'Invalid file upload.'
            });
        }
    }

    // Add comment to report
    report.comments.push({
        userId: req.user.id,
        commentText: req.body.commentText,
        photoUrl
    });

    await report.save();

    // Create notification for report owner
    if (report.reporter.toString() !== req.user.id.toString()) {
        try {
            const notificationMessage = `New comment on your report: ${req.body.commentText.substring(0, 50)}${req.body.commentText.length > 50 ? '...' : ''}`;
            await createNotification(
                report.reporter,
                report._id,
                'comment',
                notificationMessage
            );
        } catch (error) {
            console.error('Failed to create comment notification:', error);
            // Don't fail the comment addition if notification fails
        }
    }

    // If admin commented, notify the reporter
    if (req.user.role === 'admin' && report.reporter.toString() !== req.user.id.toString()) {
        try {
            const notificationMessage = `Admin commented on your report: ${req.body.commentText.substring(0, 50)}${req.body.commentText.length > 50 ? '...' : ''}`;
            await createNotification(
                report.reporter,
                report._id,
                'admin_comment',
                notificationMessage
            );
        } catch (error) {
            console.error('Failed to create admin comment notification:', error);
            // Don't fail the comment addition if notification fails
        }
    }

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Update report status and create task (admin only)
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
exports.updateReportStatus = asyncHandler(async (req, res, next) => {
    const { status, taskDetails } = req.body;
    const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
        return next(new AppError('Invalid status value', 400));
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    // Update report status
    report.status = status;

    // If status is 'In Progress' and task details are provided, create a task
    if (status === 'In Progress') {
        if (!taskDetails || !taskDetails.assignedTo) {
            return next(new AppError('Task details and assigned user are required for In Progress status', 400));
        }

        try {
            const task = await AdminTask.create({
                title: taskDetails.title || `Task for Report #${report._id}`,
                description: taskDetails.description || report.description,
                reportId: report._id,
                assignedTo: taskDetails.assignedTo,
                createdBy: req.user.id,
                priority: taskDetails.priority || 'Medium',
                dueDate: taskDetails.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
            });

            report.assignedTo = taskDetails.assignedTo;
        } catch (error) {
            console.error('Failed to create task:', error);
            return next(new AppError('Failed to create task: ' + error.message, 500));
        }
    }

    await report.save();

    try {
        // Format the notification message
        const notificationMessage = `Your report status has been updated to: ${status}`;
        
        // Create notification for reporter
        const notification = await createNotification(
            report.reporter,
            report._id,
            'status_change',
            notificationMessage
        );
        console.log('Status notification created:', notification._id);
    } catch (error) {
        console.error('Failed to create status notification:', error);
        // Don't fail the status update if notification fails
    }

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private (own reports for users, any report for admin)
exports.deleteReport = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    // Check if user is authorized to delete this report
    // Users can only delete their own pending reports, admins can delete any report
    if (req.user.role !== 'admin') {
        if (report.reporter.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to delete this report', 403));
        }
        
        if (report.status !== 'Pending') {
            return next(new AppError('Can only delete reports with Pending status', 400));
        }
    }

    // Delete associated tasks
    await AdminTask.deleteMany({ reportId: report._id });

    // Delete associated notifications
    await Notification.deleteMany({ reportId: report._id });

    // Delete the report
    await report.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
}); 