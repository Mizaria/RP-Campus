const express = require('express');
const router = express.Router();
const {
  createReport,
  getAllReports,
  getMyActiveReports,
  getMyResolvedReports,
  getReportById,
  updateReport,
  deleteReport,
  updateSeverity,
  acceptReport,
  updateAdminStatus,
  getAdminHistory
} = require('../controllers/reportController');

// Import middleware
const { protect, adminOnly, authenticatedUsers } = require('../middleware/authMiddleware');

// Student/Staff Routes
router.post('/', protect, authenticatedUsers, createReport);                    // Create report
router.get('/my-reports/active', protect, authenticatedUsers, getMyActiveReports);   // Get active reports (Pending + In_Progress)
router.get('/my-reports/resolved', protect, authenticatedUsers, getMyResolvedReports); // Get resolved reports
router.put('/:id', protect, authenticatedUsers, updateReport);                 // Update my report (pending only)
router.delete('/:id', protect, authenticatedUsers, deleteReport);              // Delete my report (pending only)

// Admin Routes
router.get('/admin/dashboard', protect, adminOnly, getAllReports);             // Admin dashboard - all reports
router.get('/admin/history', protect, adminOnly, getAdminHistory);             // Admin history page
router.patch('/:id/severity', protect, adminOnly, updateSeverity);             // Update severity
router.patch('/:id/accept', protect, adminOnly, acceptReport);                 // Accept report
router.patch('/:id/admin-update', protect, adminOnly, updateAdminStatus);      // Update admin status/remarks

// Shared Routes (must be last to avoid conflicts)
router.get('/:id', protect, authenticatedUsers, getReportById);                // Get single report

module.exports = router;
