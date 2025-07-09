const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload.middleware');
const {
    createReport,
    getReports,
    getReport,
    getUserReports,
    updateReport,
    updateReportStatus,
    acceptReport,
    addComment,
    clearComments,
    deleteReport
} = require('../controllers/report.controller');

// Apply authentication middleware to all routes
router.use(protect);

// Routes for all authenticated users
router.post('/', upload.single('photo'), createReport);
router.get('/user/me', getUserReports);
router.get('/user-stats', async (req, res, next) => {
    try {
        const Report = require('../models/Report');
        const userId = req.user.id;

        // Get user's report statistics
        const totalReports = await Report.countDocuments({ reportedBy: userId });
        const pendingReports = await Report.countDocuments({ 
            reportedBy: userId, 
            status: { $in: ['pending', 'in-progress'] } 
        });
        const resolvedReports = await Report.countDocuments({ 
            reportedBy: userId, 
            status: 'resolved' 
        });

        res.status(200).json({
            success: true,
            data: {
                totalReports,
                pendingReports,
                resolvedReports
            }
        });
    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics'
        });
    }
});
router.get('/:id', getReport);
router.put('/:id', upload.single('photo'), updateReport);
router.post('/:id/comments', upload.single('photo'), addComment);
router.delete('/:id/comments', authorize('admin'), clearComments);
router.delete('/:id', deleteReport); // Users can delete own pending reports

// Admin only routes
router.get('/', authorize('admin'), getReports);
router.put('/:id/status', authorize('admin'), updateReportStatus);
router.post('/:id/accept', authorize('admin'), acceptReport);

module.exports = router;