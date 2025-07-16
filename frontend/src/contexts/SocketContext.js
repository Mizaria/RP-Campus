import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const { user } = useAuth();

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

    useEffect(() => {
        if (user) {
            // Create socket connection
            const token = localStorage.getItem('token');
            const newSocket = io(API_BASE_URL, {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            // Listen for user status updates
            newSocket.on('userStatusUpdate', (data) => {
                console.log('User status update:', data);
                const { userId, status } = data;
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    if (status === 'online') {
                        newSet.add(userId);
                    } else {
                        newSet.delete(userId);
                    }
                    return newSet;
                });
            });

            // Listen for socket errors
            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user, API_BASE_URL]);

    // Helper function to check if a user is online
    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    // Helper function to get online status
    const getUserStatus = (userId) => {
        return isUserOnline(userId) ? 'online' : 'offline';
    };

    const value = {
        socket,
        isConnected,
        onlineUsers,
        isUserOnline,
        getUserStatus
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
