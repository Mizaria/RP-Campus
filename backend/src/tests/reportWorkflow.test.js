const {
    connectDB,
    cleanupDB,
    setupTestUsers,
    loginAsUser,
    createTestReport,
    updateReportStatus,
    addComment
} = require('./testUtils');

let studentToken;
let adminToken;
let reportId;
let adminId;

async function runTests() {
    try {
        console.log('Starting report workflow tests...\n');

        // 1. Login as student and admin
        console.log('1. Logging in as student and admin...');
        const studentLogin = await loginAsUser('student');
        studentToken = studentLogin.token;
        console.log('Student login successful');
        console.log('Input:', { email: 'student@example.com', password: 'password123' });
        console.log('Output:', { token: studentToken, user: studentLogin.user });

        const adminLogin = await loginAsUser('admin');
        adminToken = adminLogin.token;
        adminId = adminLogin.user._id;
        console.log('Admin login successful');
        console.log('Input:', { email: 'admin@example.com', password: 'password123' });
        console.log('Output:', { token: adminToken, user: adminLogin.user });

        // 2. Create a new report
        console.log('\n2. Creating a new report...');
        const reportInput = {
            description: 'Electrical issue in Room 101',
            category: 'Electrical',
            priority: 'High',
            location: 'Building A',
            building: 'Main Building',
            room: '101'
        };
        const report = await createTestReport(studentToken, reportInput);
        reportId = report._id;
        console.log('Input:', reportInput);
        console.log('Output:', report);

        // 3. Verify initial report status
        console.log('\n3. Verifying initial report status...');
        if (report.status !== 'Pending') {
            throw new Error('Initial report status should be Pending');
        }
        console.log('Input: New report');
        console.log('Output:', { status: report.status });

        // 4. Admin updates report status
        console.log('\n4. Admin updating report status to In Progress...');
        const taskDetails = {
            title: 'Fix electrical issue',
            description: 'Investigate and fix the reported electrical problem',
            assignedTo: adminLogin.user._id,
            priority: 'High',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        };
        const statusUpdate = await updateReportStatus(adminToken, reportId, 'In Progress', taskDetails);
        console.log('Input:', { status: 'In Progress', taskDetails });
        console.log('Output:', statusUpdate);

        // 5. Admin adds a comment
        console.log('\n5. Admin adding a comment...');
        const adminComment = await addComment(adminToken, reportId, 'Initial inspection completed. Parts ordered.');
        console.log('Input:', { comment: 'Initial inspection completed. Parts ordered.' });
        console.log('Output:', adminComment);

        // 6. Student adds a response comment
        console.log('\n6. Student adding a response comment...');
        const studentComment = await addComment(studentToken, reportId, 'Thank you for the update. Please let me know when the parts arrive.');
        console.log('Input:', { comment: 'Thank you for the update. Please let me know when the parts arrive.' });
        console.log('Output:', studentComment);

        // 7. Admin resolves the report
        console.log('\n7. Admin resolving the report...');
        const resolution = await updateReportStatus(adminToken, reportId, 'Resolved');
        console.log('Input:', { status: 'Resolved' });
        console.log('Output:', resolution);

        console.log('\nAll report workflow tests completed successfully! 🎉\n');

    } catch (error) {
        console.error('Test failed:');
        if (error.response) {
            console.error('Error:', error.response.data.message || error.response.data.error?.message || 'Unknown error');
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

// Run the tests
async function runAllTests() {
    try {
        // Connect to database
        await connectDB();
        console.log('Database connected successfully');

        // Setup test users
        await setupTestUsers();
        console.log('Test users setup completed');

        // Run the tests
        await runTests();
        console.log('Tests completed successfully');

        // Cleanup
        await cleanupDB();
        console.log('Database connection closed');

        process.exit(0);
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
}

// Start the tests
runAllTests(); 