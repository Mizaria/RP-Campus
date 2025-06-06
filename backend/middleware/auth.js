const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/userModel');
const { check } = require('express-validator');

// Validation middleware
const validateRegistration = [
  check('firstName').trim().notEmpty().withMessage('First name is required'),
  check('lastName').trim().notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Please include a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  check('role').isIn(['student', 'staff', 'admin']).withMessage('Invalid role')
];

const validateLogin = [
  check('email').isEmail().withMessage('Please include a valid email'),
  check('password').exists().withMessage('Password is required')
];

// Auth middleware
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Role-based middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

const isStaffOrAdmin = (req, res, next) => {
  if (req.user && ['staff', 'admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as staff or admin' });
  }
};

module.exports = { protect, isAdmin, isStaffOrAdmin, validateRegistration, validateLogin };