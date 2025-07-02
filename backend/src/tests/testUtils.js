const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api`;

// Test user data
const testUsers = {
    admin: {
        username: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
    },
    staff: {
        username: 'staff',
        name: 'Staff User',
        email: 'staff@example.com',
        password: 'password123',
        role: 'staff'
    },
    student: {
        username: 'student',
        name: 'Student User',
        email: 'student@example.com',
        password: 'password123',
        role: 'student'
    }
};

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Shared test data
const testReport = {
    description: 'Test report for automated testing',
    category: 'Electrical',
    priority: 'High',
    location: 'Building A',
    building: 'Main Building',
    room: '101',
    contactNumber: '1234567890',
    email: 'student@example.com'
};

const testTask = {
    title: 'Test Task',
    description: 'This is a test task for automated testing',
    priority: 'High',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

// Authentication helpers
async function loginAsUser(role) {
    const userData = testUsers[role];
    if (!userData) {
        throw new Error(`Invalid role: ${role}`);
    }

    try {
        const response = await axios.post('/auth/login', {
            email: userData.email,
            password: userData.password
        });

        // Ensure we have the user ID
        if (!response.data.user || !response.data.user.id) {
            throw new Error(`Failed to get user ID for ${role}`);
        }

        // Convert id to _id to match Mongoose's format
        const user = {
            ...response.data.user,
            _id: response.data.user.id
        };

        return {
            token: response.data.token,
            user
        };
    } catch (error) {
        console.error(`${role} login failed:`, error.response?.data || error.message);
        throw error;
    }
}

// Report helpers
async function createTestReport(token, reportData = {}) {
    try {
        let response;
        if (reportData instanceof FormData) {
            response = await axios.post('/reports', reportData, {
                headers: {
                    ...reportData.getHeaders(),
                    Authorization: `Bearer ${token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
        } else {
            response = await axios.post('/reports', {
                ...testReport,
                ...reportData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        return response.data.data;
    } catch (error) {
        console.error('Failed to create test report:', error.response?.data || error.message);
        throw error;
    }
}

async function updateReportStatus(token, reportId, status, taskDetails = null) {
    try {
        const payload = { status };
        if (taskDetails) {
            payload.taskDetails = taskDetails;
        }

        const response = await axios.put(`/reports/${reportId}/status`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to update report status:', error.response?.data || error.message);
        throw error;
    }
}

async function addComment(token, reportId, commentText, photo = null) {
    try {
        const formData = new FormData();
        formData.append('commentText', commentText);
        if (photo) {
            formData.append('photo', photo);
        }

        const response = await axios.post(`/reports/${reportId}/comments`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to add comment:', error.response?.data || error.message);
        throw error;
    }
}

// Task helpers
async function createAdminTask(token, reportId, taskData = {}) {
    try {
        const response = await axios.post('/admin/tasks', {
            ...testTask,
            reportId,
            ...taskData
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to create admin task:', error.response?.data || error.message);
        throw error;
    }
}

// Notification helpers
async function getNotifications(token) {
    try {
        const response = await axios.get('/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to get notifications:', error.response?.data || error.message);
        throw error;
    }
}

async function markNotificationAsRead(token, notificationId) {
    try {
        const response = await axios.patch(`/notifications/${notificationId}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to mark notification as read:', error.response?.data || error.message);
        throw error;
    }
}

// Check if server is available
const checkServerAvailability = async () => {
    try {
        const response = await axios.get(`${API_URL}/health`);
        return response.status === 200;
    } catch (error) {
        console.error('Server is not available. Please ensure the server is running.');
        return false;
    }
};

// Database connection utility
const connectDB = async () => {
    try {
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('Already connected to MongoDB');
            return true;
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connection Successful!');
        return true;
    } catch (error) {
        console.error('❌ Database Connection Error:', error.message);
        return false;
    }
};

// Database cleanup utility
const cleanupDB = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            console.log('No active database connection to close');
            return true;
        }

        await mongoose.connection.close();
        console.log('Database connection closed.');
        return true;
    } catch (error) {
        console.error('Error closing database connection:', error.message);
        return false;
    }
};

// Test user setup utility
const setupTestUsers = async () => {
    try {
        // Check server availability first
        const serverAvailable = await checkServerAvailability();
        if (!serverAvailable) {
            throw new Error('Server is not available');
        }

        console.log('Setting up test users...\n');
        const tokens = {};

        // Helper function to check if user exists and create if not
        async function ensureUser(userData) {
            try {
                // Try to login first
                console.log(`Attempting to login as ${userData.role}...`);
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    email: userData.email,
                    password: userData.password
                });
                console.log(`${userData.role} login successful\n`);
                return loginResponse.data.token;
            } catch (loginError) {
                // If login fails, try to register
                console.log(`${userData.role} login failed, attempting registration...`);
                try {
                    const registerResponse = await axios.post(`${API_URL}/auth/register`, userData);
                    console.log(`${userData.role} registration successful\n`);
                    return registerResponse.data.token;
                } catch (registerError) {
                    console.error(`${userData.role} registration failed:`, registerError.response?.data || registerError.message);
                    throw registerError;
                }
            }
        }

        // Setup all test users
        for (const [role, userData] of Object.entries(testUsers)) {
            console.log(`Setting up ${role} user...`);
            tokens[`${role}Token`] = await ensureUser(userData);
            console.log(`${role} setup complete\n`);
        }

        console.log('All test users setup successfully! 🎉\n');
        return tokens;
    } catch (error) {
        console.error('Setup failed:', error.response?.data || error.message);
        throw error;
    }
};

// Test data cleanup utility
const cleanupTestData = async (tokens) => {
    try {
        if (!tokens || !tokens.adminToken) {
            console.log('No admin token available for cleanup');
            return false;
        }

        console.log('Cleaning up test data...');
        
        // Delete test reports
        const adminToken = tokens.adminToken;
        const reportsResponse = await axios.get(`${API_URL}/reports`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        for (const report of reportsResponse.data.data) {
            await axios.delete(`${API_URL}/reports/${report._id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
        }
        
        console.log('Test data cleanup complete!');
        return true;
    } catch (error) {
        console.error('Cleanup failed:', error.response?.data || error.message);
        return false;
    }
};

module.exports = {
    // Configuration
    API_URL,
    testUsers,
    testReport,
    testTask,

    // Database utilities
    connectDB,
    cleanupDB,
    checkServerAvailability,

    // User management
    setupTestUsers,
    cleanupTestData,
    loginAsUser,

    // Report operations
    createTestReport,
    updateReportStatus,
    addComment,

    // Task operations
    createAdminTask,

    // Notification operations
    getNotifications,
    markNotificationAsRead
}; 