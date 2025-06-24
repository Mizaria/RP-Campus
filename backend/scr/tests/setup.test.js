const { connectDB, cleanupDB, setupTestUsers, cleanupTestData, checkServerAvailability } = require('./testUtils');

async function runSetup() {
    try {
        // Check server availability
        const serverAvailable = await checkServerAvailability();
        if (!serverAvailable) {
            throw new Error('Server is not available. Please start the server first.');
        }

        // Connect to database
        const connected = await connectDB();
        if (!connected) {
            throw new Error('Failed to connect to database');
        }

        // Setup test users
        const tokens = await setupTestUsers();

        // Cleanup test data
        await cleanupTestData(tokens);

        // Close database connection
        await cleanupDB();

        console.log('Setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup
runSetup(); 