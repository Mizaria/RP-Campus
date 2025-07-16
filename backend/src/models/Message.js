const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender ID is required']
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Receiver ID is required']
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        type: {
            type: String,
            enum: ['text', 'image'],
            default: 'text'
        }
    },
    {timestamps: true}
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;