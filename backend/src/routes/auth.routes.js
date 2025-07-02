const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { protect, authorize } = require('./../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../../uploads');
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
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
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
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
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
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

// @desc    Update user profile image
// @route   PUT /api/auth/me/image
// @access  Private
router.put('/me/image', protect, upload.single('image'), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Update user's profile image
        user.image = req.file.path;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                image: user.image
            }
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
});

// @desc    Update user profile image
// @route   PUT /api/auth/profile-image
// @access  Private
router.put('/profile-image', protect, upload.single('profileImage'), async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('No image file provided', 400));
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImage: req.file.filename },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Profile image update error:', error);
        next(new AppError(error.message, 400));
    }
});

// @desc    Complete signup with profile image
// @route   POST /api/auth/complete-signup
// @access  Public
router.post('/complete-signup', upload.single('profileImage'), async (req, res, next) => {
    try {
        const { userId, token } = req.body;
        console.log('Complete signup request:', { userId, token: token ? 'present' : 'missing', hasFile: !!req.file });
        
        if (!userId || !token) {
            console.log('Missing userId or token');
            return next(new AppError('Missing userId or token', 400));
        }
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', { decodedId: decoded.id, providedUserId: userId });
        
        if (decoded.id !== userId) {
            console.log('Token ID mismatch:', { decodedId: decoded.id, providedUserId: userId });
            return next(new AppError('Invalid token', 401));
        }

        // Update user with profile image if provided
        const updateData = {};
        if (req.file) {
            console.log('File uploaded:', req.file.filename);
            updateData.profileImage = req.file.filename;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!user) {
            console.log('User not found for ID:', userId);
            return next(new AppError('User not found', 404));
        }

        console.log('Signup completed successfully for user:', user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Complete signup error:', error);
        next(new AppError(error.message, 400));
    }
});

module.exports = router;