const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const {
    connectDB,
    cleanupDB,
    setupTestUsers,
    loginAsUser,
    createTestReport,
    addComment
} = require('./testUtils');

let studentToken;
let reportId;

// Test file paths
const testImagePath = path.join(__dirname, 'test-files', 'test-image.jpg');

// Create test directory and file if they don't exist
if (!fs.existsSync(path.join(__dirname, 'test-files'))) {
    fs.mkdirSync(path.join(__dirname, 'test-files'));
}

// Create a test image if it doesn't exist
if (!fs.existsSync(testImagePath)) {
    // Create a simple test image (1x1 pixel JPEG)
    const testImage = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQRAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AP/8A/9k=', 'base64');
    fs.writeFileSync(testImagePath, testImage);
}

async function runTests() {
    try {
        console.log('Starting file upload tests...\n');

        // 1. Login as student
        console.log('1. Logging in as student...');
        const studentLogin = await loginAsUser('student');
        studentToken = studentLogin.token;
        console.log('Login successful');
        console.log('Input:', { email: 'student@example.com', password: 'password123' });
        console.log('Output:', { token: studentToken, user: studentLogin.user });

        // 2. Create report with photo
        console.log('\n2. Creating report with photo...');
        const formData = new FormData();
        formData.append('photo', fs.createReadStream(testImagePath), {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg'
        });

        // Add report fields
        const reportFields = {
            description: 'Test report with photo upload',
            category: 'Electrical',
            priority: 'Low',
            location: 'Building A',
            building: 'Main Building',
            room: 'Room 101',
            contactNumber: '1234567890',
            email: 'student@example.com'
        };

        Object.entries(reportFields).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const report = await createTestReport(studentToken, formData);
        reportId = report._id;
        console.log('Input:', {
            ...reportFields,
            photo: {
                filename: 'test-image.jpg',
                contentType: 'image/jpeg',
                size: fs.statSync(testImagePath).size
            }
        });
        console.log('Output:', report);

        // 3. Verify report photo
        console.log('\n3. Verifying report photo...');
        if (report.photoUrl) {
            console.log('Input: Check report photo URL');
            console.log('Output:', { photoUrl: report.photoUrl });
        } else {
            throw new Error('Report photo URL not found');
        }

        // 4. Add comment with photo
        console.log('\n4. Adding comment with photo...');
        const commentFormData = new FormData();
        const commentText = 'Test comment with photo upload';
        commentFormData.append('commentText', commentText);
        commentFormData.append('photo', fs.createReadStream(testImagePath), {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg'
        });

        const comment = await addComment(studentToken, reportId, commentText, commentFormData);
        console.log('Input:', {
            commentText,
            photo: {
                filename: 'test-image.jpg',
                contentType: 'image/jpeg',
                size: fs.statSync(testImagePath).size
            }
        });
        console.log('Output:', comment);

        // 5. Verify comment photo
        console.log('\n5. Verifying comment photo...');
        if (comment.photoUrl) {
            console.log('Input: Check comment photo URL');
            console.log('Output:', { photoUrl: comment.photoUrl });
        } else {
            throw new Error('Comment photo URL not found');
        }

        console.log('\nAll file upload tests completed successfully! 🎉\n');

    } catch (error) {
        console.error('\nTest failed:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
        throw error;
    } finally {
        // Cleanup test files
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        if (fs.existsSync(path.join(__dirname, 'test-files'))) {
            fs.rmdirSync(path.join(__dirname, 'test-files'));
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