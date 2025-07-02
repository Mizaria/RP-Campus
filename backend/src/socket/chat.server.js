const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const ChatRoom = require('../models/ChatRoom');

class ChatServer {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
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

        // Join chat room
        socket.on('joinRoom', async (data) => {
            try {
                const { roomId } = data;
                const chatRoom = await ChatRoom.findById(roomId);
                
                if (!chatRoom) {
                    return socket.emit('error', { message: 'Chat room not found' });
                }

                if (!chatRoom.participants.includes(socket.user.id)) {
                    return socket.emit('error', { message: 'Not authorized to join this chat room' });
                }

                socket.join(roomId);
                console.log(`User ${socket.user.id} joined chat room: ${roomId}`);
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'Error joining chat room' });
            }
        });

        // Handle new messages
        socket.on('sendMessage', async (data) => {
            try {
                const { roomId, content, type = 'text' } = data;
                
                // Verify user is in the chat room
                const chatRoom = await ChatRoom.findById(roomId);
                if (!chatRoom || !chatRoom.participants.includes(socket.user.id)) {
                    return socket.emit('error', { message: 'Not authorized to send messages in this chat room' });
                }

                // Create new chat message
                const chatMessage = await ChatMessage.create({
                    roomId,
                    sender: socket.user.id,
                    content,
                    type,
                    readBy: [socket.user.id] // Mark as read by sender
                });

                // Update chat room's last message
                chatRoom.lastMessage = chatMessage._id;
                chatRoom.updatedAt = Date.now();
                await chatRoom.save();

                // Populate sender information
                await chatMessage.populate('sender', 'username role');

                // Broadcast to all users in the chat room
                this.io.to(roomId).emit('newMessage', chatMessage);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            const { roomId } = data;
            socket.to(roomId).emit('userTyping', {
                userId: socket.user.id,
                username: socket.user.username
            });
        });

        // Handle message read status
        socket.on('markAsRead', async (data) => {
            try {
                const { messageId } = data;
                const message = await ChatMessage.findById(messageId);
                
                if (!message) {
                    return socket.emit('error', { message: 'Message not found' });
                }

                // Verify user is in the chat room
                const chatRoom = await ChatRoom.findById(message.roomId);
                if (!chatRoom || !chatRoom.participants.includes(socket.user.id)) {
                    return socket.emit('error', { message: 'Not authorized to mark messages as read in this chat room' });
                }

                if (!message.readBy.includes(socket.user.id)) {
                    message.readBy.push(socket.user.id);
                    await message.save();
                    
                    // Notify other users in the room
                    this.io.to(message.roomId).emit('messageRead', {
                        messageId,
                        readBy: message.readBy
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
        });
    }
}

module.exports = ChatServer; 