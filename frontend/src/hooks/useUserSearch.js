import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useUserSearch = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
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

    // Fetch all users for messaging
    const fetchUsers = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/messages/users`);
            setUsers(response);
            setFilteredUsers(response);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Filter users based on search query
    const filterUsers = useCallback((query) => {
        if (!query.trim()) {
            setFilteredUsers(users);
            return;
        }

        const filtered = users.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            user.role.toLowerCase().includes(query.toLowerCase())
        );
        
        setFilteredUsers(filtered);
    }, [users]);

    // Update search query and filter users
    const updateSearchQuery = useCallback((query) => {
        setSearchQuery(query);
        filterUsers(query);
    }, [filterUsers]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setFilteredUsers(users);
    }, [users]);

    // Get user profile image URL
    const getUserProfileImageUrl = useCallback((profileImage) => {
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

    // Initialize users on mount
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        users,
        filteredUsers,
        searchQuery,
        loading,
        error,
        updateSearchQuery,
        clearSearch,
        fetchUsers,
        getUserProfileImageUrl,
        formatUserRole
    };
};

export default useUserSearch;
