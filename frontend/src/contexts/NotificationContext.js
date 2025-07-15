import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
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

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return { success: false, error: 'Authentication expired' };
        }
        return { success: false, error: `HTTP error! status: ${response.status}` };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const result = await makeAuthenticatedRequest(`${API_BASE_URL}/api/notifications/unread`);
      
      if (result.success) {
        setUnreadCount(result.data?.length || 0);
      } else {
        console.error('Error fetching unread notifications:', result.error);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read and update count
  const markAsRead = async (notificationId) => {
    try {
      const result = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        { method: 'PATCH' }
      );
      
      if (result.success) {
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { success: true };
      } else {
        return { success: false, error: result.message || 'Failed to mark notification as read' };
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const result = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        { method: 'PATCH' }
      );
      
      if (result.success) {
        setUnreadCount(0);
        return { success: true };
      } else {
        return { success: false, error: result.message || 'Failed to mark all notifications as read' };
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false, error: err.message };
    }
  };

  // Refresh unread count (useful after creating new notifications)
  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  // Fetch unread count when user changes or component mounts
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      loading,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      refreshUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
