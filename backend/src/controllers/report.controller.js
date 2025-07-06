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

// @desc    Clear all comments from a report (admin only)
// @route   DELETE /api/reports/:id/comments
// @access  Private/Admin
exports.clearComments = asyncHandler(async (req, res, next) => {
    console.log(`[DEBUG] Clear comments called for report ID: ${req.params.id} by user: ${req.user.email}`);
    
    const report = await Report.findById(req.params.id);

    if (!report) {
        console.log(`[DEBUG] Report not found: ${req.params.id}`);
        return next(new AppError('Report not found', 404));
    }

    // Only admins can clear comments
    if (req.user.role !== 'admin') {
        console.log(`[DEBUG] Unauthorized user tried to clear comments: ${req.user.email}, role: ${req.user.role}`);
        return next(new AppError('Not authorized to clear comments', 403));
    }

    console.log(`[DEBUG] Report before clearing comments - Total comments: ${report.comments.length}`);
    
    // Clear all comments
    report.comments = [];
    await report.save();

    console.log(`[DEBUG] Report after clearing comments - Total comments: ${report.comments.length}`);

    res.status(200).json({
        success: true,
        message: 'Comments cleared successfully',
        data: report
    });
});

// @desc    Update report status and create task (admin only)
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
exports.updateReportStatus = asyncHandler(async (req, res, next) => {
    console.log('=== UPDATE REPORT STATUS CALLED ===');
    console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('Report ID:', req.params.id);
    
    const { status, priority, taskDetails, assignedTo } = req.body;
    
    console.log('Destructured values:', { 
        status: status, 
        priority: priority, 
        taskDetails: taskDetails,
        assignedTo: assignedTo 
    });
    
    // Validate status if provided
    if (status !== undefined) {
        console.log('Status validation - received status:', status, typeof status);
        const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
            console.log('INVALID STATUS - received:', status, 'expected one of:', allowedStatuses);
            return next(new AppError('Invalid status value', 400));
        }
    }

    // Validate priority if provided
    if (priority !== undefined) {
        console.log('Priority validation - received priority:', priority, typeof priority);
        const allowedPriorities = ['Low', 'High'];
        if (!allowedPriorities.includes(priority)) {
            console.log('INVALID PRIORITY - received:', priority, 'expected one of:', allowedPriorities);
            return next(new AppError('Invalid priority value', 400));
        }
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    // Update report status if provided
    if (status) {
        report.status = status;
    }

    // Update report priority if provided
    if (priority) {
        report.priority = priority;
    }

    // Handle assignedTo update (can be null to unassign)
    if (assignedTo !== undefined) {
        report.assignedTo = assignedTo;
        console.log('Updated assignedTo to:', assignedTo);
    }

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
        let notificationMessage = '';
        if (status && priority) {
            notificationMessage = `Your report status has been updated to: ${status} and priority changed to: ${priority}`;
        } else if (status) {
            notificationMessage = `Your report status has been updated to: ${status}`;
        } else if (priority) {
            notificationMessage = `Your report priority has been updated to: ${priority}`;
        }
        
        if (notificationMessage) {
            // Create notification for reporter
            const notification = await createNotification(
                report.reporter,
                report._id,
                'status_change',
                notificationMessage
            );
            console.log('Status notification created:', notification._id);
        }
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

// @desc    Update a report (users can only update their own pending reports)
// @route   PUT /api/reports/:id
// @access  Private
exports.updateReport = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    // Check if user is authorized to update this report
    if (report.reporter.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this report', 403));
    }

    // Check if report can be updated (only pending reports)
    if (report.status !== 'Pending') {
        return next(new AppError('Can only update reports with Pending status', 400));
    }

    // Handle file upload if present
    if (req.file) {
        try {
            console.log('Processing file upload for update:', req.file);
            await fileService.validateFile(req.file);
            const photoUrl = fileService.getFileUrl(req.file.filename);
            console.log('Generated photo URL for update:', photoUrl);
            req.body.photoUrl = photoUrl;
        } catch (error) {
            console.error('File upload error during update:', error);
            return res.status(error.statusCode || 400).json({
                status: 'error',
                message: error.message || 'Invalid file upload.'
            });
        }
    }

    // Update only allowed fields
    const allowedFields = ['category', 'description', 'location', 'building', 'room', 'photoUrl'];
    const updateData = {};
    
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    ).populate('reporter', 'username name email')
     .populate('assignedTo', 'username name email');

    res.status(200).json({
        success: true,
        data: updatedReport
    });
});

// @desc    Accept a report (admin only) - Creates task and updates status
// @route   POST /api/reports/:id/accept
// @access  Private/Admin
exports.acceptReport = asyncHandler(async (req, res, next) => {
    console.log('=== ACCEPT REPORT CALLED ===');
    console.log('Report ID:', req.params.id);
    console.log('Admin User ID:', req.user.id);
    console.log('Admin Username:', req.user.username);
    
    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new AppError('Report not found', 404));
    }

    console.log('Current report status:', report.status);
    console.log('Current report priority:', report.priority);
    console.log('Current report assignedTo:', report.assignedTo);

    // Check if report is still pending
    if (report.status !== 'Pending') {
        return next(new AppError('Only pending reports can be accepted', 400));
    }

    try {
        // Map report priority to admin task priority
        let taskPriority = 'Medium'; // Default
        if (report.priority === 'High') {
            taskPriority = 'High';
        } else if (report.priority === 'Low') {
            taskPriority = 'Low';
        }

        console.log('Creating admin task with:', {
            reportId: report._id,
            assignedTo: req.user.id,
            createdBy: req.user.id,
            priority: taskPriority,
            status: 'To Do'
        });

        // Create admin task
        const task = await AdminTask.create({
            reportId: report._id,
            assignedTo: req.user.id,
            createdBy: req.user.id,
            priority: taskPriority,
            status: 'To Do'
        });

        console.log('Admin task created successfully:', task._id);

        // Update report status and assign to admin
        report.status = 'In Progress';
        report.assignedTo = req.user.id;
        await report.save();

        console.log('Report updated - Status:', report.status, 'AssignedTo:', report.assignedTo);

        // Create notification for reporter
        try {
            const notificationMessage = `Your report has been accepted and is now in progress. Assigned to: ${req.user.username || req.user.name}`;
            await createNotification(
                report.reporter,
                report._id,
                'status_change',
                notificationMessage
            );
            console.log('Notification created for reporter');
        } catch (error) {
            console.error('Failed to create acceptance notification:', error);
        }

        // Populate the updated report
        const updatedReport = await Report.findById(report._id)
            .populate('reporter', 'username name email')
            .populate('assignedTo', 'username name email');

        console.log('Final updated report:', {
            id: updatedReport._id,
            status: updatedReport.status,
            assignedTo: updatedReport.assignedTo
        });

        res.status(200).json({
            success: true,
            data: {
                report: updatedReport,
                task: task
            },
            message: 'Report accepted successfully'
        });

    } catch (error) {
        console.error('Error in acceptReport:', error);
        return next(new AppError('Failed to accept report: ' + error.message, 500));
    }
});