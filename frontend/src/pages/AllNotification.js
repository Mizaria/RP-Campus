import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useNotifications from '../hooks/useNotifications';
import '../assets/styles/Notification.css';
import backgroundImage from '../assets/images/mainBackground.svg';
import adminbackgroundImage from '../assets/images/adminmainbackground.svg';


// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    // Debug: Log user data to see if profileImage is included
    useEffect(() => {
        console.log('Dashboard user data:', user);
        console.log('API_BASE_URL:', API_BASE_URL);
        if (user?.profileImage) {
            console.log('Constructed image URL:', `${API_BASE_URL}/uploads/${user.profileImage}`);
        }
    }, [user]);


    const toggleNavbar = () => {
        setIsNavbarVisible(!isNavbarVisible);
        // Dispatch custom event to toggle navbar
        window.dispatchEvent(new CustomEvent('toggleNavbar', {
            detail: { isVisible: !isNavbarVisible }
        }));
    };

    // Listen for navbar toggle events from other components
    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    const toggleModel = () => {
        // Dispatch custom event to toggle modal
        window.dispatchEvent(new CustomEvent('toggleModal', {
            detail: { isOpen: true }
        }));
    };
    return (
        <div className="mainBackground" style={{ backgroundImage: `url(${user?.role === 'admin' ? adminbackgroundImage : backgroundImage})` }}>
            <div className="nav-bar">
                <div className="bar-item-menu" onClick={toggleNavbar}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-item-modal" onClick={toggleModel}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-search">
                    <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
                    <input type="text" placeholder="Search report..." />
                </div>
                <div className="bar-item">
                    <img src="/images/Notification Icon.svg" alt="Notification Icon" width="20px" height="20px" />
                    <img src="/images/Green Circle.svg" alt="Notification Indicator" className="notification-circle" />
                </div>
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>Notifications</h2>
                </div>
            </div>
        </div>
    );
};

const StatusUpdateCard = ({ notification, onMarkAsRead, formatTime, getStatusBackgroundColor }) => {
    const handleMarkAsRead = () => {
        if (!notification.isRead && onMarkAsRead) {
            onMarkAsRead(notification._id);
        }
    };

    const reportId = notification.reportId._id;
    const shortId = reportId ? reportId.toString().slice(-4) : '????';
    
    // Extract status from notification message or statusData - ONLY use historical data
    let status = 'Unknown';
    
    console.log('[NOTIFICATION DEBUG] Raw notification data:', {
        hasStatusData: !!notification.statusData,
        statusData: notification.statusData,
        message: notification.message,
        messageType: typeof notification.message,
        fullNotification: notification
    });
    
    // First try to get from statusData (new notifications with embedded historical status)
    if (notification.statusData?.newStatus) {
        status = notification.statusData.newStatus;
        console.log('[NOTIFICATION DEBUG] Using HISTORICAL status from statusData:', status);
    } 
    // Fallback: extract from message for backward compatibility (also historical)
    else if (notification.message) {
        console.log('[NOTIFICATION DEBUG] Attempting to parse message:', notification.message);
        
        // Test message parsing with debug info
        const testMessage = notification.message;
        console.log('[NOTIFICATION DEBUG] Testing regex patterns on:', testMessage);
        
        // Try multiple regex patterns to catch different message formats
        let statusMatch = testMessage.match(/updated to:\s*(.+?)(?:\s+and\s|$)/i);
        console.log('[NOTIFICATION DEBUG] Pattern 1 result:', statusMatch);
        
        if (!statusMatch) {
            statusMatch = testMessage.match(/changed to:\s*(.+?)(?:\s+and\s|$)/i);
            console.log('[NOTIFICATION DEBUG] Pattern 2 result:', statusMatch);
        }
        if (!statusMatch) {
            statusMatch = testMessage.match(/status.*?:\s*(.+?)(?:\s+and\s|$)/i);
            console.log('[NOTIFICATION DEBUG] Pattern 3 result:', statusMatch);
        }
        if (!statusMatch) {
            // Handle "is now [status]" format like "is now in progress"
            statusMatch = testMessage.match(/is now\s+(.+?)(?:\.\s|$)/i);
            console.log('[NOTIFICATION DEBUG] Pattern 4 "is now" result:', statusMatch);
        }
        if (!statusMatch) {
            // Handle "accepted and is now [status]" format
            statusMatch = testMessage.match(/accepted and is now\s+(.+?)(?:\.\s|$)/i);
            console.log('[NOTIFICATION DEBUG] Pattern 5 "accepted and is now" result:', statusMatch);
        }
        
        if (statusMatch && statusMatch[1]) {
            status = statusMatch[1].trim();
            console.log('[NOTIFICATION DEBUG] Extracted HISTORICAL status from message:', status);
        } else {
            console.log('[NOTIFICATION DEBUG] Could not extract status from message. Trying full message analysis...');
            console.log('[NOTIFICATION DEBUG] Message content:', JSON.stringify(notification.message));
            
            // Try a more lenient pattern as last resort
            const laxMatch = notification.message.match(/(?:updated|changed|to).*?([A-Za-z\s]+)(?:\s+and|$)/i);
            if (laxMatch && laxMatch[1]) {
                const extractedStatus = laxMatch[1].trim();
                // Only use if it looks like a valid status
                if (['pending', 'in progress', 'resolved', 'cancelled'].some(s => 
                    extractedStatus.toLowerCase().includes(s))) {
                    status = extractedStatus;
                    console.log('[NOTIFICATION DEBUG] Extracted status with lax pattern:', status);
                }
            }
        }
    } else {
        console.log('[NOTIFICATION DEBUG] No message found in notification');
    }
    
    // REMOVED: Do NOT use notification.reportId?.status as it shows CURRENT status
    // which changes every time the report is updated, breaking historical accuracy!
    
    const backgroundColor = getStatusBackgroundColor(status);

    // Enhanced debug logging to track the issue
    console.log('[NOTIFICATION DEBUG] StatusUpdateCard render:', {
        notificationId: notification._id,
        reportId: reportId,
        shortId: shortId,
        statusFromStatusData: notification.statusData?.newStatus,
        statusFromMessage: notification.message,
        currentReportStatus: notification.reportId?.status, // This changes over time!
        historicalStatusUsed: status, // This should stay constant!
        createdAt: notification.createdAt,
        fullStatusData: notification.statusData
    });

    return (
        <div className="notification-card" onClick={handleMarkAsRead}>
            <p className="notification-title">Report Status Update</p>
            <div className="notification-des">
                <p>Your Report #{shortId} has been changed to <span style={{ backgroundColor: backgroundColor }}>"{status}"</span> state.</p>
                <p>{formatTime(notification.createdAt)}</p>
            </div>
            {!notification.isRead && <div className="is-read"></div>}
        </div>
    );
};
const UrgentCard = ({ notification, onMarkAsRead, formatTime }) => {
    const handleMarkAsRead = () => {
        if (!notification.isRead && onMarkAsRead) {
            onMarkAsRead(notification._id);
        }
    };

    const reportId = notification.reportId._id;
    const shortId = reportId ? reportId.toString().slice(-4) : '????';
    
    // Extract priority from notification message or statusData
    let priority = 'Unknown';
    let backgroundColor = '#F5C4B8'; // Default to high priority color
    
    // First try to get from statusData
    if (notification.statusData?.newPriority) {
        priority = notification.statusData.newPriority;
    } 
    // Fallback: extract from message
    else if (notification.message) {
        if (notification.message.toLowerCase().includes('high priority') || 
            notification.message.toLowerCase().includes('flagged as high')) {
            priority = 'High';
        } else if (notification.message.toLowerCase().includes('low')) {
            priority = 'Low';
        }
    }
    
    // Set background color based on priority
    if (priority === 'High') {
        backgroundColor = '#F5C4B8'; // High priority - light red
    } else if (priority === 'Low') {
        backgroundColor = '#D9F5B8'; // Low priority - light green
    }

    console.log('[URGENT NOTIFICATION DEBUG] UrgentCard render:', {
        notificationId: notification._id,
        reportId: reportId,
        shortId: shortId,
        priority: priority,
        backgroundColor: backgroundColor,
        message: notification.message,
        statusData: notification.statusData
    });

    return (
        <div className="notification-card" onClick={handleMarkAsRead}>
            <p className="notification-title">
                {priority === 'High' ? 'Flagged Report' : 'Priority Changed'}
            </p>
            <div className="notification-des">
                <p>
                    Report #{shortId} has been {priority === 'High' ? 'flagged as' : 'changed to'} <span style={{ backgroundColor: backgroundColor }}>{priority}</span> Priority
                </p>
                <p>{formatTime(notification.createdAt)}</p>
            </div>
            {!notification.isRead && <div className="is-read"></div>}
        </div>
    );
};



const Notification = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [isClearingAll, setIsClearingAll] = useState(false);
    const { 
        notifications, 
        loading, 
        error, 
        markAsRead, 
        markAllAsRead,
        clearAllNotifications,
        getStatusBackgroundColor, 
        formatTime 
    } = useNotifications();
    
    // Listen for navbar toggle events from other components
    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        const result = await markAsRead(notificationId);
        if (!result.success) {
            console.error('Failed to mark notification as read:', result.error);
        }
    };

    const handleReadAll = async () => {
        if (isMarkingAllRead) return; // Prevent multiple clicks
        
        setIsMarkingAllRead(true);
        try {
            const result = await markAllAsRead();
            if (result.success) {
                console.log('All notifications marked as read successfully');
                // You could add a toast notification here
            } else {
                console.error('Failed to mark all notifications as read:', result.error);
                alert('Failed to mark all notifications as read. Please try again.');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsMarkingAllRead(false);
        }
    };

    const handleClearAll = async () => {
        if (isClearingAll) return; // Prevent multiple clicks
        
        if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            setIsClearingAll(true);
            try {
                const result = await clearAllNotifications();
                if (result.success) {
                    console.log('All notifications cleared successfully');
                    // You could add a toast notification here
                } else {
                    console.error('Failed to clear all notifications:', result.error);
                    alert('Failed to clear all notifications. Please try again.');
                }
            } catch (error) {
                console.error('Error clearing all notifications:', error);
                alert('An error occurred. Please try again.');
            } finally {
                setIsClearingAll(false);
            }
        }
    };

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav />
            <div className="dashboard-content">
                <div className='notification-controll'>
                    <p 
                        onClick={handleReadAll} 
                        style={{ 
                            cursor: isMarkingAllRead ? 'not-allowed' : 'pointer',
                            opacity: isMarkingAllRead ? 0.6 : 1
                        }}
                    >
                        {isMarkingAllRead ? 'Reading...' : 'Read All'}
                    </p>
                    <p 
                        onClick={handleClearAll} 
                        style={{ 
                            cursor: isClearingAll ? 'not-allowed' : 'pointer',
                            opacity: isClearingAll ? 0.6 : 1
                        }}
                    >
                        {isClearingAll ? 'Clearing...' : 'Clear All'}
                    </p>
                </div>
                <div className="report-vertical-notification">
                    {loading ? (
                        <div className="loading-message">
                            <p>Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">
                            <p>Error loading notifications: {error}</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="no-notifications-message">
                            <p>No notifications found.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            if (notification.type === 'status_change') {
                                return (
                                    <StatusUpdateCard
                                        key={notification._id}
                                        notification={notification}
                                        onMarkAsRead={handleMarkAsRead}
                                        formatTime={formatTime}
                                        getStatusBackgroundColor={getStatusBackgroundColor}
                                    />
                                );
                            } else if (notification.type === 'priority_change') {
                                return (
                                    <UrgentCard
                                        key={notification._id}
                                        notification={notification}
                                        onMarkAsRead={handleMarkAsRead}
                                        formatTime={formatTime}
                                    />
                                );
                            }
                            // Add other notification types here in the future
                            return null;
                        })
                    )}
                </div>
            </div>
        </div>
    );
};


export default Notification;