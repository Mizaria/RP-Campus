const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload.middleware');
const {
    createReport,
    getReports,
    getReport,
    getUserReports,
    updateReportStatus,
    addComment,
    deleteReport
} = require('../controllers/report.controller');

// Apply authentication middleware to all routes
router.use(protect);

// Routes for all authenticated users
router.post('/', upload.single('photo'), createReport);
router.get('/user/me', getUserReports);
router.get('/:id', getReport);
router.post('/:id/comments', upload.single('photo'), addComment);
router.delete('/:id', deleteReport); // Users can delete own pending reports

// Admin only routes
router.get('/', authorize('admin'), getReports);
router.put('/:id/status', authorize('admin'), updateReportStatus);

module.exports = router; 