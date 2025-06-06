const express = require('express');
const router = express.Router();
// We'll implement these controllers later
// const {
//   createAnnouncement,
//   getAnnouncements,
//   updateAnnouncement,
//   deleteAnnouncement
// } = require('../controllers/announcementController');

// Temporary route for testing
router.get('/', (req, res) => {
  res.json({ message: 'Announcements route working' });
});

module.exports = router;