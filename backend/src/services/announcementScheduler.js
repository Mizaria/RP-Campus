const cron = require('node-cron');
const { cleanupExpiredAnnouncements } = require('../middleware/announcement.middleware');

// Schedule cleanup task to run daily at 2 AM
// This is optional since MongoDB TTL index handles automatic deletion
const scheduleAnnouncementCleanup = () => {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('Running scheduled announcement cleanup...');
        try {
            const deletedCount = await cleanupExpiredAnnouncements();
            console.log(`Announcement cleanup completed. Deleted ${deletedCount} expired announcements.`);
        } catch (error) {
            console.error('Error during scheduled announcement cleanup:', error);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    console.log('✅ Announcement cleanup scheduler initialized');
};

module.exports = {
    scheduleAnnouncementCleanup
};
