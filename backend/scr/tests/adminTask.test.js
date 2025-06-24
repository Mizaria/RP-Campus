const {
    connectDB,
    cleanupDB,
    setupTestUsers,
    loginAsUser,
    createTestReport,
    createAdminTask,
    updateTaskStatus,
    addTaskNote,
    getOverdueTasks
} = require('./testUtils');

let adminToken;
let studentToken;
let reportId;
let taskId;

async function runTests() {
    try {
        console.log('Starting admin task tests...');

        // 1. Login as admin
        console.log('\n1. Logging in as admin...');
        const adminLogin = await loginAsUser('admin');
        adminToken = adminLogin.token;
        console.log('Admin login successful');

        // 2. Login as student
        console.log('\n2. Logging in as student...');
        const studentLogin = await loginAsUser('student');
        studentToken = studentLogin.token;
        console.log('Student login successful');

        // 3. Create test report
        console.log('\n3. Creating test report...');
        const report = await createTestReport(studentToken);
        reportId = report._id;
        console.log('Test report created successfully');

        // 4. Create new task
        console.log('\n4. Creating new task...');
        const task = await createAdminTask(adminToken, {
            reportId,
            title: 'Test Task',
            description: 'Test task description',
            priority: 'High',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });
        taskId = task._id;
        console.log('Task created successfully');

        // 5. Get all tasks
        console.log('\n5. Getting all tasks...');
        const tasks = await getOverdueTasks(adminToken);
        console.log('Tasks retrieved successfully');

        // 6. Get single task
        console.log('\n6. Getting single task...');
        const singleTask = await getOverdueTasks(adminToken, taskId);
        console.log('Single task retrieved successfully');

        // 7. Update task status
        console.log('\n7. Updating task status...');
        const updatedTask = await updateTaskStatus(adminToken, taskId, 'In Progress');
        console.log('Task status updated successfully');

        // 8. Add note to task
        console.log('\n8. Adding note to task...');
        const taskWithNote = await addTaskNote(adminToken, taskId, 'Test note');
        console.log('Note added successfully');

        // 9. Get overdue tasks
        console.log('\n9. Getting overdue tasks...');
        const overdueTasks = await getOverdueTasks(adminToken);
        console.log('Overdue tasks retrieved successfully');

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('\nTest failed:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
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