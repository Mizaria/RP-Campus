import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useChatList = () => {
    const { user } = useAuth();
    const { isConnected } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper function to make authenticated API calls
    const makeAuthenticatedRequest = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
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

    // Fetch conversations for the current user
    const fetchConversations = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            console.log('Fetching conversations for user:', user.id);
            console.log('API URL:', `${API_BASE_URL}/api/messages/conversations`);

            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/conversations`);
            console.log('Conversations response:', response);
            setConversations(response);
        } catch (err) {
            console.error('Error fetching conversations:', err);
            console.error('Error details:', err.message);
            setError(err.message || 'Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Get user profile image URL
    const getProfileImageUrl = useCallback((profileImage) => {
        if (profileImage) {
            return `${API_BASE_URL}/uploads/${profileImage}`;
        }
        return '/images/Frame 47.svg'; // Default avatar
    }, []);

    // Format user role for display
    const formatUserRole = useCallback((role) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'staff':
                return 'Staff';
            case 'student':
                return 'Student';
            default:
                return role || 'User';
        }
    }, []);

    // Format timestamp for display
    const formatTimestamp = useCallback((timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }, []);

    // Initialize conversations on mount
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Refresh conversations when socket connection status changes
    useEffect(() => {
        if (isConnected) {
            fetchConversations();
        }
    }, [isConnected, fetchConversations]);

    return {
        conversations,
        loading,
        error,
        fetchConversations,
        getProfileImageUrl,
        formatUserRole,
        formatTimestamp
    };
};

export default useChatList;
