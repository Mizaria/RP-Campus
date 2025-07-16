import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useChat = (userId) => {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Helper function to make authenticated API calls
    const makeAuthenticatedRequest = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(options.isFormData ? {} : { 'Content-Type': 'application/json' })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    };

    // Fetch user information
    const fetchUserInfo = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/users`);
            const foundUser = response.find(u => u._id === userId);
            if (foundUser) {
                setOtherUser(foundUser);
            } else {
                setError('User not found');
            }
        } catch (err) {
            console.error('Error fetching user info:', err);
            setError(err.message || 'Failed to fetch user information');
        }
    }, [userId]);

    // Fetch messages between current user and other user
    const fetchMessages = useCallback(async () => {
        if (!userId || !user) return;

        try {
            setLoading(true);
            setError(null);

            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/${userId}`);
            setMessages(response);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.message || 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    }, [userId, user]);

    // Send text message
    const sendTextMessage = useCallback(async (text) => {
        if (!text.trim() || !userId || !socket) return;

        const tempId = 'temp_' + Date.now() + '_' + Math.random();
        
        try {
            setSending(true);
            setError(null);

            // Create temporary message for optimistic update
            const tempMessage = {
                _id: tempId,
                text: text.trim(),
                type: 'text',
                senderId: { _id: user?.id, username: user?.username },
                receiverId: { _id: userId },
                createdAt: new Date().toISOString(),
                status: 'sending'
            };

            // Add temporary message immediately for better UX
            setMessages(prev => [...prev, tempMessage]);

            // Send via REST API for persistence (primary method)
            const savedMessage = await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/send/${userId}`, {
                method: 'POST',
                body: JSON.stringify({ text: text.trim(), type: 'text' })
            });

            // Replace temporary message with real one
            setMessages(prev => 
                prev.map(msg => 
                    msg._id === tempId ? savedMessage : msg
                )
            );

            // Send via socket for real-time delivery to other user
            socket.emit('sendDirectMessage', {
                receiverId: userId,
                messageId: savedMessage._id
            });

        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message || 'Failed to send message');
            
            // Remove temporary message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        } finally {
            setSending(false);
        }
    }, [userId, socket, user]);

    // Send image message
    const sendImageMessage = useCallback(async (imageFile) => {
        if (!imageFile || !userId) return;

        const tempId = 'temp_img_' + Date.now() + '_' + Math.random();
        
        try {
            setSending(true);
            setError(null);

            // Create temporary message for optimistic update
            const tempMessage = {
                _id: tempId,
                type: 'image',
                image: URL.createObjectURL(imageFile), // Preview URL
                senderId: { _id: user?.id, username: user?.username },
                receiverId: { _id: userId },
                createdAt: new Date().toISOString(),
                status: 'uploading'
            };

            // Add temporary message immediately
            setMessages(prev => [...prev, tempMessage]);

            // Create FormData for image upload
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('type', 'image');

            // Send via REST API (file upload requires REST)
            const savedMessage = await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/send/${userId}`, {
                method: 'POST',
                body: formData,
                isFormData: true
            });

            // Replace temporary message with real one
            setMessages(prev => 
                prev.map(msg => {
                    if (msg._id === tempId) {
                        // Clean up the temporary preview URL
                        if (msg.image && msg.image.startsWith('blob:')) {
                            URL.revokeObjectURL(msg.image);
                        }
                        return savedMessage;
                    }
                    return msg;
                })
            );

            // Emit via socket for real-time notification
            if (socket) {
                socket.emit('sendDirectMessage', {
                    receiverId: userId,
                    messageId: savedMessage._id
                });
            }

        } catch (err) {
            console.error('Error sending image:', err);
            setError(err.message || 'Failed to send image');
            
            // Remove temporary message and clean up preview URL
            setMessages(prev => {
                const tempMsg = prev.find(m => m._id === tempId);
                if (tempMsg && tempMsg.image && tempMsg.image.startsWith('blob:')) {
                    URL.revokeObjectURL(tempMsg.image);
                }
                return prev.filter(msg => msg._id !== tempId);
            });
        } finally {
            setSending(false);
        }
    }, [userId, socket, user]);

    // Handle typing indicator
    const handleTyping = useCallback(() => {
        if (!socket || !userId) return;

        if (!typing) {
            setTyping(true);
            socket.emit('typing', { receiverId: userId });
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
            socket.emit('stopTyping', { receiverId: userId });
        }, 2000);
    }, [socket, userId, typing]);

    // Mark message as read
    const markAsRead = useCallback(async (messageId) => {
        if (!messageId || !socket) return;

        try {
            socket.emit('markAsRead', { messageId });
            
            // Also mark via REST API
            await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/${messageId}/read`, {
                method: 'PATCH'
            });
        } catch (err) {
            console.error('Error marking message as read:', err);
        }
    }, [socket]);

    // Get image URL helper
    const getImageUrl = useCallback((imageName) => {
        if (!imageName) return null;
        return `${API_BASE_URL}/uploads/${imageName}`;
    }, []);

    // Set up socket listeners
    useEffect(() => {
        if (!socket || !userId) return;

        // Listen for new messages (from other users)
        const handleNewMessage = (message) => {
            // Only add messages for this conversation and from other users
            if (message.senderId._id === userId && message.receiverId._id === user?.id) {
                setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.some(m => m._id === message._id);
                    if (!exists) {
                        return [...prev, message];
                    }
                    return prev;
                });
                
                // Mark as read since we're viewing the conversation
                markAsRead(message._id);
            }
        };

        // Listen for message sent confirmation (status updates only)
        const handleMessageSent = (data) => {
            const message = data.message || data;
            
            // Update message status for messages we sent
            if (message.senderId._id === user?.id && message.receiverId._id === userId) {
                setMessages(prev => 
                    prev.map(m => {
                        // Replace temporary message with real one
                        if (m._id && m._id.toString().startsWith('temp_')) {
                            return message;
                        }
                        // Or update existing message
                        if (m._id === message._id) {
                            return { ...m, status: 'sent', ...message };
                        }
                        return m;
                    })
                );
            }
        };

        // Listen for typing indicators
        const handleUserTyping = (data) => {
            if (data.senderId === userId) {
                setIsTyping(true);
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (data.senderId === userId) {
                setIsTyping(false);
            }
        };

        // Listen for read receipts
        const handleMessageRead = (data) => {
            setMessages(prev => 
                prev.map(msg => 
                    msg._id === data.messageId 
                        ? { ...msg, readBy: data.readBy }
                        : msg
                )
            );
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('messageSent', handleMessageSent);
        socket.on('userTyping', handleUserTyping);
        socket.on('userStoppedTyping', handleUserStoppedTyping);
        socket.on('messageRead', handleMessageRead);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messageSent', handleMessageSent);
            socket.off('userTyping', handleUserTyping);
            socket.off('userStoppedTyping', handleUserStoppedTyping);
            socket.off('messageRead', handleMessageRead);
        };
    }, [socket, userId, user?.id, markAsRead]);

    // Initial data fetch
    useEffect(() => {
        if (userId) {
            fetchUserInfo();
            fetchMessages();
        }
    }, [userId, fetchUserInfo, fetchMessages]);

    // Cleanup typing timeout
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        messages,
        otherUser,
        loading,
        sending,
        error,
        isTyping,
        isConnected,
        sendTextMessage,
        sendImageMessage,
        handleTyping,
        markAsRead,
        getImageUrl,
        refetchMessages: fetchMessages
    };
};

export default useChat;
