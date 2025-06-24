const nodemailer = require('nodemailer');
const AppError = require('../utils/AppError');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendEmail(options) {
        try {
            const mailOptions = {
                from: `"RP Campus Care" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html
            };

            const info = await this.transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            throw new AppError('Error sending email', 500);
        }
    }

    // Email templates for different notifications
    async sendReportCreatedEmail(user, report) {
        const subject = 'New Report Created';
        const html = `
            <h2>Report Created Successfully</h2>
            <p>Dear ${user.username},</p>
            <p>Your report has been created successfully. Here are the details:</p>
            <ul>
                <li>Report ID: ${report._id}</li>
                <li>Category: ${report.category}</li>
                <li>Priority: ${report.priority}</li>
                <li>Status: ${report.status}</li>
            </ul>
            <p>We will keep you updated on the progress.</p>
            <p>Thank you for using RP Campus Care.</p>
        `;

        return this.sendEmail({
            to: user.email,
            subject,
            html
        });
    }

    async sendStatusUpdateEmail(user, report) {
        const subject = 'Report Status Updated';
        const html = `
            <h2>Report Status Update</h2>
            <p>Dear ${user.username},</p>
            <p>The status of your report has been updated:</p>
            <ul>
                <li>Report ID: ${report._id}</li>
                <li>New Status: ${report.status}</li>
                <li>Category: ${report.category}</li>
                <li>Priority: ${report.priority}</li>
            </ul>
            <p>You can view the full details in your dashboard.</p>
            <p>Thank you for using RP Campus Care.</p>
        `;

        return this.sendEmail({
            to: user.email,
            subject,
            html
        });
    }

    async sendTaskAssignmentEmail(admin, task) {
        const subject = 'New Task Assigned';
        const html = `
            <h2>Task Assignment</h2>
            <p>Dear ${admin.username},</p>
            <p>You have been assigned a new task:</p>
            <ul>
                <li>Task: ${task.title}</li>
                <li>Priority: ${task.priority}</li>
                <li>Due Date: ${new Date(task.dueDate).toLocaleDateString()}</li>
                <li>Description: ${task.description}</li>
            </ul>
            <p>Please log in to your dashboard to view the full details.</p>
            <p>Thank you for your service.</p>
        `;

        return this.sendEmail({
            to: admin.email,
            subject,
            html
        });
    }

    async sendCommentNotificationEmail(user, report, comment) {
        const subject = 'New Comment on Your Report';
        const html = `
            <h2>New Comment</h2>
            <p>Dear ${user.username},</p>
            <p>A new comment has been added to your report:</p>
            <ul>
                <li>Report ID: ${report._id}</li>
                <li>Comment: ${comment.commentText}</li>
                <li>By: ${comment.userId.username}</li>
            </ul>
            <p>You can view the full details in your dashboard.</p>
            <p>Thank you for using RP Campus Care.</p>
        `;

        return this.sendEmail({
            to: user.email,
            subject,
            html
        });
    }

    async sendPasswordResetEmail(user, resetToken) {
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const subject = 'Password Reset Request';
        const html = `
            <h2>Password Reset</h2>
            <p>Dear ${user.username},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetURL}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thank you for using RP Campus Care.</p>
        `;

        return this.sendEmail({
            to: user.email,
            subject,
            html
        });
    }
}

module.exports = new EmailService(); 