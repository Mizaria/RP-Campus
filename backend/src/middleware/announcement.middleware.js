// Middleware for announcement validation and utilities

const Announcement = require('../models/Announcement');

// Middleware to check if user can manage announcements (admin only)
const checkAnnouncementPermission = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only administrators can manage announcements.' 
        });
    }
    next();
};

// Middleware to check if user owns the announcement
const checkAnnouncementOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (announcement.createdBy.toString() !== userId) {
            return res.status(403).json({ 
                message: 'Access denied. You can only manage announcements you created.' 
            });
        }

        // Attach announcement to request for use in controller
        req.announcement = announcement;
        next();
    } catch (error) {
        console.error('Error checking announcement ownership:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Middleware to check if announcement has expired
const checkAnnouncementExpiry = (req, res, next) => {
    if (req.announcement && req.announcement.expiresAt < new Date()) {
        return res.status(400).json({ 
            message: 'This announcement has expired and cannot be modified.' 
        });
    }
    next();
};

// Utility function to clean up expired announcements manually (if needed)
const cleanupExpiredAnnouncements = async () => {
    try {
        const result = await Announcement.deleteMany({
            expiresAt: { $lte: new Date() }
        });
        console.log(`Cleaned up ${result.deletedCount} expired announcements`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired announcements:', error);
        throw error;
    }
};

module.exports = {
    checkAnnouncementPermission,
    checkAnnouncementOwnership,
    checkAnnouncementExpiry,
    cleanupExpiredAnnouncements
};
