const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload.middleware');
const {
    createReport,
    getReports,
    getReport,
    getUserReports,
    getUserStats,
    getAdminStats,
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
router.get('/user-stats', getUserStats);

// Admin only routes (must come before parameterized routes)
router.get('/admin-stats', authorize('admin'), getAdminStats);
router.get('/', authorize('admin'), getReports);
router.put('/:id/status', authorize('admin'), updateReportStatus);
router.post('/:id/accept', authorize('admin'), acceptReport);

// Parameterized routes (must come after specific routes)
router.get('/:id', getReport);
router.put('/:id', upload.single('photo'), updateReport);
router.post('/:id/comments', upload.single('photo'), addComment);
router.delete('/:id/comments', authorize('admin'), clearComments);
router.delete('/:id', deleteReport); // Users can delete own pending reports

module.exports = router;