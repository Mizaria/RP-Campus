const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { protect, authorize } = require('./../middleware/authMiddleware');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
    try {
        const { username, name, email, password, role } = req.body;
        console.log('Registration attempt:', { username, email, role });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return next(new AppError('User already exists', 400));
        }

        // Create user
        console.log('Creating new user with data:', {
            username,
            email,
            role: role || 'student'
        });

        const user = await User.create({
            username,
            name,
            email,
            passwordHash: password, // This will be hashed by the pre-save middleware
            role: role || 'student'
        });

        console.log('User created successfully:', {
            id: user._id,
            email: user.email,
            role: user.role,
            hasPassword: !!user.passwordHash
        });

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        next(new AppError(error.message, 400));
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return next(new AppError('Invalid credentials', 401));
        }
        console.log('User found:', { 
            id: user._id, 
            email: user.email, 
            role: user.role,
            hasPassword: !!user.passwordHash 
        });

        // Check password using matchPassword method
        const isMatch = await user.matchPassword(password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return next(new AppError('Invalid credentials', 401));
        }

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log('Login successful, token created');

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        next(new AppError(error.message, 400));
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
});

// @desc    Delete user (for testing purposes)
// @route   DELETE /api/auth/users/:email
// @access  Private/Admin
router.delete('/users/:email', protect, authorize('admin'), async (req, res, next) => {
    try {
        const user = await User.findOneAndDelete({ email: req.params.email });
        
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
});

module.exports = router; 