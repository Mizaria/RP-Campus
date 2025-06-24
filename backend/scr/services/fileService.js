const fs = require('fs').promises;
const path = require('path');
const AppError = require('../utils/appError');

class FileService {
    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        this.ensureUploadDirectory();
    }

    async ensureUploadDirectory() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    async deleteFile(filename) {
        if (!filename) {
            const err = new Error('No file name provided for deletion');
            err.statusCode = 400;
            throw err;
        }
        try {
            const filePath = path.join(this.uploadDir, filename);
            await fs.unlink(filePath);
        } catch (error) {
            // Log and ignore if file does not exist
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    getFileUrl(filename) {
        if (!filename) {
            throw new AppError('Filename is required', 400);
        }
        // Ensure the URL starts with a forward slash
        return `/uploads/${filename}`;
    }

    async validateFile(file) {
        if (!file) {
            const err = new Error('No file provided for validation');
            err.statusCode = 400;
            throw err;
        }

        // For multer disk storage, we need to check the file in the uploads directory
        const filePath = path.join(this.uploadDir, file.filename);
        try {
            await fs.access(filePath);
        } catch {
            throw new AppError('Uploaded file not found', 500);
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            // Clean up the invalid file
            await this.deleteFile(file.filename);
            throw new AppError('Invalid file type. Only JPEG, PNG and GIF are allowed', 400);
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            // Clean up the oversized file
            await this.deleteFile(file.filename);
            throw new AppError('File size too large. Maximum size is 5MB', 400);
        }
    }
}

module.exports = new FileService(); 