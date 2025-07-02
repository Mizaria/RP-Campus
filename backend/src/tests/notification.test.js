const {
    connectDB,
    cleanupDB,
    setupTestUsers,
    loginAsUser,
    createTestReport,
    updateReportStatus,
    getNotifications,
    markNotificationAsRead
} = require('./testUtils');

let studentToken;
let adminToken;
let testReportId;
let testNotificationId;
let adminId;

async function runTests() {
    try {
        console.log('Starting notification tests...\n');

        // 1. Login as student
        console.log('1. Logging in as student...');
        const studentLogin = await loginAsUser('student');
        studentToken = studentLogin.token;
        console.log('Student login successful');
        console.log('Input:', { email: 'student@example.com', password: 'password123' });
        console.log('Output:', { token: studentToken, user: studentLogin.user });

        // 2. Create a report (should trigger notification)
        console.log('\n2. Creating a new report...');
        const reportInput = {
            description: 'Water leakage in Room 202',
            category: 'Plumbing',
            priority: 'High',
            location: 'Building B',
            building: 'Main Building',
            room: '202'
        };
        const report = await createTestReport(studentToken, reportInput);
        testReportId = report._id;
        console.log('Input:', reportInput);
        console.log('Output:', report);

        // 3. Student checks their notifications
        console.log('\n3. Student checking notifications...');
        const studentNotifications = await getNotifications(studentToken);
        console.log('Input: GET /notifications');
        console.log('Output:', {
            count: studentNotifications.length,
            notifications: studentNotifications
        });

        // 4. Login as admin
        console.log('\n4. Logging in as admin...');
        const adminLogin = await loginAsUser('admin');
        adminToken = adminLogin.token;
        adminId = adminLogin.user._id;
        console.log('Admin login successful');
        console.log('Input:', { email: 'admin@example.com', password: 'password123' });
        console.log('Output:', { token: adminToken, user: adminLogin.user });

        // 5. Admin checks their notifications
        console.log('\n5. Admin checking notifications...');
        const adminNotifications = await getNotifications(adminToken);
        console.log('Input: GET /notifications');
        console.log('Output:', {
            count: adminNotifications.length,
            notifications: adminNotifications
        });

        // 6. Admin updates report status (should trigger notification)
        console.log('\n6. Admin updating report status...');
        const taskDetails = {
            title: 'Fix water leakage',
            description: 'Investigate and fix the reported water leakage issue',
            assignedTo: adminId,
            priority: 'High',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        const statusUpdate = await updateReportStatus(adminToken, testReportId, 'In Progress', taskDetails);
        console.log('Input:', { status: 'In Progress', taskDetails });
        console.log('Output:', statusUpdate);

        // 7. Student checks unread notifications
        console.log('\n7. Student checking unread notifications...');
        const unreadNotifications = await getNotifications(studentToken);
        console.log('Input: GET /notifications');
        console.log('Output:', {
            count: unreadNotifications.length,
            notifications: unreadNotifications
        });

        // 8. Mark a notification as read
        if (unreadNotifications.length > 0) {
            testNotificationId = unreadNotifications[0]._id;
            console.log('\n8. Marking notification as read...');
            const updatedNotification = await markNotificationAsRead(studentToken, testNotificationId);
            console.log('Input:', { notificationId: testNotificationId });
            console.log('Output:', updatedNotification);
        }

        console.log('\nAll notification tests completed successfully! 🎉\n');

    } catch (error) {
        console.error('Test failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
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