const constants = {
  PORT: process.env.PORT || 4000,
  CLIENT_URL: 'http://localhost:3000',
  UPLOAD_PATHS: {
    REPORTS: 'uploads/reports',
    PROFILES: 'uploads/profiles'
  },
  FILE_SIZE_LIMIT: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  REPORT_STATUS: {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    RESOLVED: 'Resolved'
  },
  SEVERITY: {
    LOW: 'Low',
    HIGH: 'High'
  },
  USER_ROLES: {
    STUDENT: 'student',
    STAFF: 'staff',
    ADMIN: 'admin'
  }
};

module.exports = constants;