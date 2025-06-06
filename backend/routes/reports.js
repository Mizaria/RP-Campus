const express = require('express');
const router = express.Router();
// We'll implement these controllers later
// const { 
//   createReport,
//   getReports,
//   getReport,
//   updateReport,
//   deleteReport
// } = require('../controllers/reportController');

// Temporary route for testing
router.get('/', (req, res) => {
  res.json({ message: 'Reports route working' });
});

module.exports = router;