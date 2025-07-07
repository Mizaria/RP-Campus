import { useState, useEffect, useCallback } from 'react';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState([]);
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
            if (response.status === 401) {
                // Token might be expired, redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Authentication expired');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    };

    // Fetch all notifications for the current user
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('[NOTIFICATIONS DEBUG] Fetching notifications from:', `${API_BASE_URL}/api/notifications`);
            const result = await makeAuthenticatedRequest(`${API_BASE_URL}/api/notifications`);
            
            console.log('[NOTIFICATIONS DEBUG] API response:', result);
            
            if (result.success) {
                console.log('[NOTIFICATIONS DEBUG] Notifications fetched successfully:', result.data.length, 'notifications');
                console.log('[NOTIFICATIONS DEBUG] Notification details:');
                result.data.forEach((notif, index) => {
                    console.log(`  ${index + 1}. ID: ${notif._id}, ReportID: ${notif.reportId?._id}, Status: ${notif.reportId?.status}, Created: ${notif.createdAt}`);
                });
                setNotifications(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch notifications');
            }
        } catch (err) {
            console.error('[NOTIFICATIONS ERROR] Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch unread notifications for the current user
    const fetchUnreadNotifications = useCallback(async () => {
        try {
            const result = await makeAuthenticatedRequest(`${API_BASE_URL}/api/notifications/unread`);
            
            if (result.success) {
                setUnreadNotifications(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch unread notifications');
            }
        } catch (err) {
            console.error('Error fetching unread notifications:', err);
            setError(err.message);
        }
    }, []);

    // Mark a notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const result = await makeAuthenticatedRequest(
                `${API_BASE_URL}/api/notifications/${notificationId}/read`,
                { method: 'PATCH' }
            );
            
            if (result.success) {
                // Update the notifications state to mark this notification as read
                setNotifications(prev => 
                    prev.map(notification => 
                        notification._id === notificationId 
                            ? { ...notification, isRead: true } 
                            : notification
                    )
                );
                
                // Remove from unread notifications
                setUnreadNotifications(prev => 
                    prev.filter(notification => notification._id !== notificationId)
                );
                
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to mark notification as read');
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // Get the status background color based on status
    const getStatusBackgroundColor = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case 'in progress':
            case 'in_progress':
                return '#F4F6BD';
            case 'resolved':
                return '#D9F5B8';
            case 'pending':
                return '#DBDBDB';
            default:
                return '#DBDBDB';
        }
    }, []);

    // Format notification message for display
    const formatNotificationMessage = useCallback((notification) => {
        if (!notification.reportId) return notification.message;
        
        const reportId = notification.reportId._id || notification.reportId;
        const shortId = reportId.toString().slice(0, 4);
        const status = notification.reportId.status || 'Unknown';
        
        return `Your Report #${shortId} has been changed to "${status}" state.`;
    }, []);

    // Format time for display
    const formatTime = useCallback((timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }, []);

    // Initial fetch when hook is used
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchNotifications();
            fetchUnreadNotifications();
        }
    }, [fetchNotifications, fetchUnreadNotifications]);

    return {
        notifications,
        unreadNotifications,
        loading,
        error,
        fetchNotifications,
        fetchUnreadNotifications,
        markAsRead,
        getStatusBackgroundColor,
        formatNotificationMessage,
        formatTime
    };
};

export default useNotifications;
