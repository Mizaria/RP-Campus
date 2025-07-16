const User = require('../models/User');
const Message = require('../models/Message');

const getUsersForMessages = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const filteredUsers = await User.find({_id: { $ne: loggedInUserId }}).select('-passwordHash');
        
        // Add online status to each user
        const usersWithStatus = filteredUsers.map(user => {
            const userObj = user.toObject();
            // Check if user is online using the global chatServer instance
            if (global.chatServer) {
                userObj.isOnline = global.chatServer.isUserOnline(user._id.toString());
                userObj.status = userObj.isOnline ? 'online' : 'offline';
            } else {
                userObj.isOnline = false;
                userObj.status = 'offline';
            }
            return userObj;
        });
        
        res.status(200).json(usersWithStatus);
    } catch (error) {
        console.error('Error fetching users for messages:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getMessagesForUser = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user.id;
        
        const messages = await Message.find({ 
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        })
        .populate('senderId', 'username role')
        .populate('receiverId', 'username role')
        .sort({ createdAt: 1 });
        
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages for user:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { text, type = 'text' } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;

        // Validate that receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        // Handle image upload
        let image = null;
        if (req.file) {
            image = req.file.filename; // Store just the filename
        }

        // Validate message content
        if (!text && !image) {
            return res.status(400).json({ message: 'Message must contain either text or image' });
        }

        // Set type based on content
        const messageType = image ? 'image' : 'text';

        const newMessage = new Message({
            text,
            image,
            senderId,
            receiverId,
            type: messageType,
            readBy: [senderId] // Mark as read by sender
        });

        await newMessage.save();
        
        // Populate sender and receiver info
        await newMessage.populate('senderId', 'username role');
        await newMessage.populate('receiverId', 'username role');

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is authorized to mark this message as read
        if (message.receiverId.toString() !== userId && message.senderId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to mark this message as read' });
        }

        // Add user to readBy array if not already present
        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            await message.save();
        }

        res.status(200).json({ message: 'Message marked as read', readBy: message.readBy });
    } catch (error) {
        console.error('Error marking message as read:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUnreadMessageCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCount = await Message.countDocuments({
            receiverId: userId,
            readBy: { $ne: userId }
        });

        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Error getting unread message count:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getUsersForMessages,
    getMessagesForUser,
    sendMessage,
    markMessageAsRead,
    getUnreadMessageCount
};