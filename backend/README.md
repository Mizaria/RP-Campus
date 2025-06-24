# RP Campus Care - Facility Reporting System

A comprehensive facility reporting system for Republic Polytechnic, allowing students and staff to report and track maintenance issues across campus.

## Features

- User authentication and role-based access control
- Facility issue reporting with photo uploads
- Real-time status tracking
- Admin dashboard for issue management
- Email notifications
- Mobile-responsive design

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO for real-time updates
- Multer for file uploads
- Nodemailer for email notifications

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd rp-campus-care
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rp-campus-care

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
FROM_EMAIL=noreply@rpcampuscare.com
FROM_NAME=RP Campus Care

# File Upload Configuration
MAX_FILE_SIZE=5242880 # 5MB
UPLOAD_PATH=uploads

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── tests/          # Test files
```

## API Documentation

API documentation will be available at `/api-docs` when running the server.

## Testing

Run tests using:
```bash
npm test
```

## License

ISC 