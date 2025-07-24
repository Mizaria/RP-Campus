const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createAnnouncement,
    getAllAnnouncements,
    getMyAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementStats
} = require('../controllers/announcement.controller');

// Get announcement statistics (Admin only)
router.get('/stats', protect, getAnnouncementStats);

// Get announcements created by current admin
router.get('/my-announcements', protect, getMyAnnouncements);

// Get all active announcements (Available to all authenticated users)
router.get('/', protect, getAllAnnouncements);

// Get a specific announcement by ID
router.get('/:id', protect, getAnnouncementById);

// Create a new announcement (Admin only)
router.post('/', protect, createAnnouncement);

// Update an announcement (Only by the admin who created it)
router.put('/:id', protect, updateAnnouncement);

// Delete an announcement (Only by the admin who created it)
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
