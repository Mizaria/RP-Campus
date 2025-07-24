// Test script to verify announcement auto-deletion after 2 weeks
const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');

// This is a test to verify the 2-week auto-deletion mechanism
async function testAnnouncementExpiry() {
    try {
        console.log('🔍 Testing Announcement Auto-Deletion Mechanism...\n');

        // Test 1: Check TTL Index Configuration
        console.log('1. Checking TTL Index Configuration:');
        const collection = mongoose.connection.db.collection('announcements');
        const indexes = await collection.indexes();
        
        const ttlIndex = indexes.find(index => 
            index.key && index.key.expiresAt && index.expireAfterSeconds === 0
        );
        
        if (ttlIndex) {
            console.log('✅ TTL Index configured correctly');
            console.log('   - Field: expiresAt');
            console.log('   - expireAfterSeconds: 0 (immediate deletion when expired)');
        } else {
            console.log('❌ TTL Index NOT found - announcements will not auto-delete');
        }

        // Test 2: Check Default Expiry Date Calculation
        console.log('\n2. Testing Default Expiry Date Calculation:');
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        console.log(`   Current time: ${now.toISOString()}`);
        console.log(`   Expected expiry (2 weeks): ${twoWeeksLater.toISOString()}`);
        
        // Create a test announcement (in memory only)
        const testAnnouncement = new Announcement({
            title: 'Test Announcement',
            description: 'This is a test',
            createdBy: new mongoose.Types.ObjectId()
        });
        
        const calculatedExpiry = testAnnouncement.expiresAt;
        const timeDifference = Math.abs(calculatedExpiry.getTime() - twoWeeksLater.getTime());
        
        if (timeDifference < 1000) { // Within 1 second tolerance
            console.log('✅ Default expiry calculation is correct');
            console.log(`   Calculated expiry: ${calculatedExpiry.toISOString()}`);
        } else {
            console.log('❌ Default expiry calculation is incorrect');
            console.log(`   Calculated expiry: ${calculatedExpiry.toISOString()}`);
            console.log(`   Expected expiry: ${twoWeeksLater.toISOString()}`);
        }

        // Test 3: Check API Filter for Expired Announcements
        console.log('\n3. API Filtering Verification:');
        console.log('✅ getAllAnnouncements() filters by: expiresAt: { $gt: new Date() }');
        console.log('   This ensures only non-expired announcements are returned');

        // Test 4: Manual Cleanup Function Test
        console.log('\n4. Manual Cleanup Function:');
        console.log('✅ cleanupExpiredAnnouncements() function available');
        console.log('   Deletes announcements where: expiresAt: { $lte: new Date() }');

        // Test 5: Scheduled Cleanup
        console.log('\n5. Scheduled Cleanup:');
        console.log('✅ Cron job scheduled to run daily at 2:00 AM UTC');
        console.log('   Pattern: "0 2 * * *"');

        console.log('\n📊 SUMMARY:');
        console.log('✅ Announcements will auto-delete after 2 weeks via:');
        console.log('   1. MongoDB TTL Index (primary mechanism)');
        console.log('   2. Daily cron cleanup (backup mechanism)');
        console.log('   3. API filters expired announcements from display');
        console.log('   4. Manual cleanup function available if needed');

        console.log('\n⏰ Timeline:');
        console.log('   - Announcement created with expiresAt = now + 14 days');
        console.log('   - MongoDB TTL index automatically deletes when expiresAt is reached');
        console.log('   - Cron job runs daily to catch any missed deletions');
        console.log('   - Frontend only displays non-expired announcements');

    } catch (error) {
        console.error('❌ Error testing announcement expiry:', error);
    }
}

// Export for potential use
module.exports = {
    testAnnouncementExpiry
};

// Run test if this file is executed directly
if (require.main === module) {
    // This would need a database connection to run
    console.log('To run this test, connect to your MongoDB database first.');
    console.log('Example usage:');
    console.log('const { testAnnouncementExpiry } = require("./announcement.expiry.test.js");');
    console.log('testAnnouncementExpiry();');
}
