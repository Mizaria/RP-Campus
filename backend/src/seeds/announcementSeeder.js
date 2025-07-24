// Announcement system seeder - Creates sample announcements for testing
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
require('dotenv').config();

const seedAnnouncements = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Find an admin user
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('❌ No admin user found. Please create an admin user first.');
            return;
        }

        console.log(`📝 Creating announcements for admin: ${adminUser.username}`);

        // Sample announcements
        const sampleAnnouncements = [
            {
                title: "System Maintenance Notice",
                description: "The campus reporting system will undergo scheduled maintenance on Friday, January 26th from 2:00 PM to 4:00 PM. During this time, the system may be temporarily unavailable. We apologize for any inconvenience and appreciate your patience.",
                createdBy: adminUser._id
            },
            {
                title: "New Reporting Categories Available",
                description: "We've added new categories for facility reporting including 'Accessibility Issues' and 'Safety Concerns'. These new categories will help us better categorize and prioritize your reports.",
                createdBy: adminUser._id
            },
            {
                title: "Holiday Schedule Update",
                description: "Please note that during the upcoming holidays, facility maintenance response times may be extended. Emergency issues will continue to be addressed promptly. Thank you for your understanding.",
                createdBy: adminUser._id
            },
            {
                title: "Campus WiFi Improvements",
                description: "We're pleased to announce that WiFi coverage has been improved in several areas including the library, student lounges, and cafeteria. If you continue to experience connectivity issues, please report them through the system.",
                createdBy: adminUser._id
            }
        ];

        // Clear existing announcements (optional - remove this line if you want to keep existing data)
        await Announcement.deleteMany({});
        console.log('🗑️ Cleared existing announcements');

        // Create new announcements
        const createdAnnouncements = await Announcement.insertMany(sampleAnnouncements);
        console.log(`✅ Created ${createdAnnouncements.length} sample announcements`);

        // Display created announcements
        console.log('\n📋 Created Announcements:');
        createdAnnouncements.forEach((announcement, index) => {
            console.log(`${index + 1}. ${announcement.title}`);
            console.log(`   Expires: ${announcement.expiresAt.toLocaleDateString()}`);
            console.log(`   ID: ${announcement._id}\n`);
        });

        console.log('✅ Seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding announcements:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
};

// Run the seeder
if (require.main === module) {
    seedAnnouncements();
}

module.exports = { seedAnnouncements };
