const Announcement = require('../models/Announcement');
const User = require('../models/User');

// Create a new announcement (Admin only)
const createAnnouncement = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can create announcements.' 
            });
        }

        // Validate input
        if (!title || !description) {
            return res.status(400).json({ 
                message: 'Title and description are required.' 
            });
        }

        // Create new announcement
        const announcement = new Announcement({
            title: title.trim(),
            description: description.trim(),
            createdBy: userId
        });

        await announcement.save();
        
        // Populate creator information
        await announcement.populate('createdBy', 'username email role');

        res.status(201).json({
            message: 'Announcement created successfully',
            announcement
        });
    } catch (error) {
        console.error('Error creating announcement:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all active announcements (Available to all users)
const getAllAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get announcements that haven't expired yet
        const announcements = await Announcement.find({
            expiresAt: { $gt: new Date() }
        })
        .populate('createdBy', 'username role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        // Get total count for pagination
        const totalCount = await Announcement.countDocuments({
            expiresAt: { $gt: new Date() }
        });

        res.status(200).json({
            announcements,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasMore: page * limit < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching announcements:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get announcements created by the current admin
const getMyAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can view their announcements.' 
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const announcements = await Announcement.find({
            createdBy: userId
        })
        .populate('createdBy', 'username role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const totalCount = await Announcement.countDocuments({
            createdBy: userId
        });

        res.status(200).json({
            announcements,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasMore: page * limit < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching my announcements:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a single announcement by ID
const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id)
            .populate('createdBy', 'username email role');

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if announcement has expired
        if (announcement.expiresAt < new Date()) {
            return res.status(404).json({ message: 'Announcement has expired' });
        }

        res.status(200).json({ announcement });
    } catch (error) {
        console.error('Error fetching announcement:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update an announcement (Only by the admin who created it)
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const userId = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can update announcements.' 
            });
        }

        // Find the announcement
        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if the current user created this announcement
        if (announcement.createdBy.toString() !== userId) {
            return res.status(403).json({ 
                message: 'Access denied. You can only update announcements you created.' 
            });
        }

        // Check if announcement has expired
        if (announcement.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Cannot update expired announcement' });
        }

        // Validate input
        if (!title || !description) {
            return res.status(400).json({ 
                message: 'Title and description are required.' 
            });
        }

        // Update the announcement
        announcement.title = title.trim();
        announcement.description = description.trim();
        
        await announcement.save();
        await announcement.populate('createdBy', 'username email role');

        res.status(200).json({
            message: 'Announcement updated successfully',
            announcement
        });
    } catch (error) {
        console.error('Error updating announcement:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete an announcement (Only by the admin who created it)
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can delete announcements.' 
            });
        }

        // Find the announcement
        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if the current user created this announcement
        if (announcement.createdBy.toString() !== userId) {
            return res.status(403).json({ 
                message: 'Access denied. You can only delete announcements you created.' 
            });
        }

        // Delete the announcement
        await Announcement.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get announcement statistics (Admin only)
const getAnnouncementStats = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can view announcement statistics.' 
            });
        }

        const now = new Date();
        
        // Get various statistics
        const [
            totalAnnouncements,
            activeAnnouncements,
            expiredAnnouncements,
            myAnnouncements,
            recentAnnouncements
        ] = await Promise.all([
            Announcement.countDocuments(),
            Announcement.countDocuments({ expiresAt: { $gt: now } }),
            Announcement.countDocuments({ expiresAt: { $lte: now } }),
            Announcement.countDocuments({ createdBy: req.user.id }),
            Announcement.countDocuments({ 
                createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
            })
        ]);

        res.status(200).json({
            stats: {
                total: totalAnnouncements,
                active: activeAnnouncements,
                expired: expiredAnnouncements,
                myAnnouncements,
                recentAnnouncements
            }
        });
    } catch (error) {
        console.error('Error fetching announcement stats:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createAnnouncement,
    getAllAnnouncements,
    getMyAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementStats
};
