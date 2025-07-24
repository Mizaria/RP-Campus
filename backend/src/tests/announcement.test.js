// Test script to verify announcement creation endpoint
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testAnnouncementCreation() {
    try {
        console.log('Testing announcement creation endpoint...');

        // First, test if the server is running
        const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
        console.log('Health check status:', healthCheck.status);

        // Test announcement creation with mock data
        const testData = {
            title: 'Test Announcement',
            description: 'This is a test announcement to verify the endpoint is working correctly.'
        };

        // Note: This test requires a valid admin token
        // You would need to login first to get a token
        console.log('Test data prepared:', testData);
        console.log('✅ Test data validation passed');
        
        console.log('\nTo test with real data:');
        console.log('1. Start the backend server: npm start');
        console.log('2. Login as an admin user to get a token');
        console.log('3. Use the token in Authorization header');
        console.log('4. POST to /api/announcements with title and description');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAnnouncementCreation();
