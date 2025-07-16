const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
// Remove ChatRoom dependency for now - using direct messaging

class ChatServer {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:4000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        
        // Track online users
        this.onlineUsers = new Map(); // userId -> { socketId, lastSeen, username }
        
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.use(this.authenticateSocket);
        this.io.on('connection', this.handleConnection.bind(this));
    }

    authenticateSocket(socket, next) {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    }

    async handleConnection(socket) {
        console.log(`User connected: ${socket.user.id}`);

        // Add user to online users tracking
        this.onlineUsers.set(socket.user.id, {
            socketId: socket.id,
            lastSeen: new Date(),
            username: socket.user.username,
            role: socket.user.role
        });

        // Broadcast user online status to all connected clients
        this.io.emit('userStatusUpdate', {
            userId: socket.user.id,
            status: 'online',
            lastSeen: new Date()
        });

        console.log(`Online users count: ${this.onlineUsers.size}`);

        // Join personal room for direct messaging
        socket.join(`user_${socket.user.id}`);

        // Handle new direct messages (relay only - messages are created via REST API)
        socket.on('sendDirectMessage', async (data) => {
            try {
                const { receiverId, text, image, type = 'text', messageId } = data;
                
                // If messageId is provided, this is a relay of an already saved message
                if (messageId) {
                    // Fetch the message from database
                    const message = await Message.findById(messageId)
                        .populate('senderId', 'username role')
                        .populate('receiverId', 'username role');
                    
                    if (message) {
                        // Send to receiver only
                        this.io.to(`user_${receiverId}`).emit('newMessage', message);
                    }
                    return;
                }

                // For backwards compatibility - create message if no messageId
                // Validate message content
                if (!text && !image) {
                    return socket.emit('error', { message: 'Message must contain either text or image' });
                }

                // Set type based on content
                const messageType = image ? 'image' : 'text';

                // Create new message
                const newMessage = new Message({
                    senderId: socket.user.id,
                    receiverId,
                    text,
                    image,
                    type: messageType,
                    readBy: [socket.user.id]
                });

                await newMessage.save();
                
                // Populate sender and receiver info
                await newMessage.populate('senderId', 'username role');
                await newMessage.populate('receiverId', 'username role');

                // Send to receiver only
                this.io.to(`user_${receiverId}`).emit('newMessage', newMessage);
                
                // Confirm to sender
                socket.emit('messageSent', { message: newMessage });
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Handle typing indicators for direct messages
        socket.on('typing', (data) => {
            const { receiverId } = data;
            this.io.to(`user_${receiverId}`).emit('userTyping', {
                senderId: socket.user.id,
                username: socket.user.username
            });
        });

        // Handle stop typing
        socket.on('stopTyping', (data) => {
            const { receiverId } = data;
            this.io.to(`user_${receiverId}`).emit('userStoppedTyping', {
                senderId: socket.user.id
            });
        });

        // Handle message read status
        socket.on('markAsRead', async (data) => {
            try {
                const { messageId } = data;
                const message = await Message.findById(messageId);
                
                if (!message) {
                    return socket.emit('error', { message: 'Message not found' });
                }

                // Check if user is authorized to mark this message as read
                if (message.receiverId.toString() !== socket.user.id && message.senderId.toString() !== socket.user.id) {
                    return socket.emit('error', { message: 'Not authorized to mark this message as read' });
                }

                if (!message.readBy.includes(socket.user.id)) {
                    message.readBy.push(socket.user.id);
                    await message.save();
                    
                    // Notify the sender that message was read (don't send to the reader)
                    if (message.senderId.toString() !== socket.user.id) {
                        this.io.to(`user_${message.senderId}`).emit('messageRead', {
                            messageId,
                            readBy: message.readBy,
                            readerId: socket.user.id
                        });
                    }
                    
                    // Also notify the reader with updated message
                    socket.emit('messageRead', {
                        messageId,
                        readBy: message.readBy,
                        readerId: socket.user.id
                    });
                }
            } catch (error) {
                console.error('Error marking message as read:', error);
                socket.emit('error', { message: 'Error marking message as read' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`);
            
            // Update user status and remove from online users
            if (this.onlineUsers.has(socket.user.id)) {
                this.onlineUsers.delete(socket.user.id);
                
                // Broadcast user offline status to all connected clients
                this.io.emit('userStatusUpdate', {
                    userId: socket.user.id,
                    status: 'offline',
                    lastSeen: new Date()
                });
                
                console.log(`Online users count: ${this.onlineUsers.size}`);
            }
        });
    }

    // Method to get online users (for API endpoint)
    getOnlineUsers() {
        const onlineUsersArray = [];
        this.onlineUsers.forEach((userData, userId) => {
            onlineUsersArray.push({
                userId,
                username: userData.username,
                role: userData.role,
                lastSeen: userData.lastSeen,
                status: 'online'
            });
        });
        return onlineUsersArray;
    }

    // Method to check if a user is online
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }
}

module.exports = ChatServer; 