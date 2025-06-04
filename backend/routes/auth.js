const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const { handleUpload, uploadProfilePicture } = require('../middleware/upload');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/authController');

// Registration validation middleware
const registerValidation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Invalid role').isIn(['student', 'staff', 'admin'])
];

// Login validation middleware
const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Routes
router.post('/register', registerValidation, handleUpload(uploadProfilePicture), registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, handleUpload(uploadProfilePicture), updateUserProfile);

module.exports = router;