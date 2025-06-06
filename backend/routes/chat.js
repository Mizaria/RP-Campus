const express = require('express');
const router = express.Router();
// We'll implement these controllers later
// const {
//   getChats,
//   getChat,
//   sendMessage
// } = require('../controllers/chatController');

// Temporary route for testing
router.get('/', (req, res) => {
  res.json({ message: 'Chat route working' });
});

module.exports = router;