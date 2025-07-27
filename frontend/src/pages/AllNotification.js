import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useAnnouncements } from '../hooks/useAnnouncements';
import NotificationIcon from '../components/NotificationIcon';
import useNotifications from '../hooks/useNotifications';
import '../assets/styles/Notification.css';
import backgroundImage from '../assets/images/mainBackground.svg';


// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ searchTerm, onSearchChange }) => {
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
        <div className="mainBackground" style={{ backgroundImage: `url(${user?.role === 'admin' ? '/images/adminmainbackground.svg' : backgroundImage})` }}>
            <div className="nav-bar">
                <div className="bar-item-menu" onClick={toggleNavbar}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-item-modal" onClick={toggleModel}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-search">
                    <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => {
                            console.log('[INPUT DEBUG] Search input changed:', e.target.value);
                            onSearchChange(e.target.value);
                        }}
                    />
                </div>
                <NotificationIcon />
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>
                        Notifications
                        {searchTerm && <span className="search-indicator"> - Search: "{searchTerm}"</span>}
                    </h2>
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

const AnnouncementCard = ({ announcement, currentUser, onUpdate, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isCreator = currentUser && announcement.createdBy._id === currentUser.id;
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
            weekday: weekdays[date.getDay()],
            day: date.getDate(),
            month: months[date.getMonth()],
            year: date.getFullYear()
        };
    };

    const dateInfo = formatDate(announcement.createdAt);

    const handleEdit = () => {
        if (onUpdate) {
            onUpdate(announcement);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(announcement._id);
        }
    };

    return (
        <div 
            className="announcement-card"
            onMouseEnter={() => isCreator && setIsHovered(true)}
            onMouseLeave={() => isCreator && setIsHovered(false)}
        >
            <div className="announcement-date">
                {(!isHovered || !isCreator) && (
                    <>
                        <p className="light-bold">{dateInfo.weekday}</p>
                        <p>{dateInfo.day} {dateInfo.month}</p>
                        <p>{dateInfo.year}</p>
                    </>
                )}
                {isCreator && isHovered && (
                    <>
                        <div className='announcement-actions' onClick={handleEdit}>
                            <img src="/images/edit.svg" alt="Edit Icon" className="dropdown-icon" width="22px"
                                height="22px" />Edit
                        </div>
                        <div className='announcement-actions' onClick={handleDelete}>
                            <img src="/images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px"
                                height="22px" />Delete
                        </div>
                    </>
                )}
            </div>
            <div className="announcement-content">
                <p className="light-bold">{announcement.title}</p>
                <p>{announcement.description}</p>
            </div>
        </div>
    );
};

const Notification = () => {
    const { user } = useAuth();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [isClearingAll, setIsClearingAll] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const { refreshUnreadCount } = useNotificationContext();
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
    
    const {
        getAnnouncements,
        updateAnnouncement,
        deleteAnnouncement,
        loading: announcementLoading,
        error: announcementError
    } = useAnnouncements();

    // Fetch announcements when component mounts
    useEffect(() => {
        const fetchAnnouncements = async () => {
            const result = await getAnnouncements(1, 50); // Get first 50 announcements
            if (result.success) {
                setAnnouncements(result.data.announcements);
            } else {
                console.error('Failed to fetch announcements:', result.error);
            }
        };

        fetchAnnouncements();
    }, [getAnnouncements]);

    // Handle announcement update
    const handleUpdateAnnouncement = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            description: announcement.description
        });
    };

    // Handle announcement delete
    const handleDeleteAnnouncement = async (announcementId) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            const result = await deleteAnnouncement(announcementId);
            if (result.success) {
                // Remove from local state
                setAnnouncements(prev => prev.filter(ann => ann._id !== announcementId));
            } else {
                alert('Failed to delete announcement: ' + result.error);
            }
        }
    };

    // Handle form submission for editing
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!editingAnnouncement) return;

        const result = await updateAnnouncement(editingAnnouncement._id, formData);
        if (result.success) {
            // Update local state
            setAnnouncements(prev => prev.map(ann => 
                ann._id === editingAnnouncement._id 
                    ? { ...ann, ...formData }
                    : ann
            ));
            setEditingAnnouncement(null);
            setFormData({ title: '', description: '' });
        } else {
            alert('Failed to update announcement: ' + result.error);
        }
    };

    // Filter notifications based on search term
    const filterNotifications = (notifications) => {
        console.log('[SEARCH DEBUG] Search term:', searchTerm);
        console.log('[SEARCH DEBUG] Total notifications:', notifications.length);

        if (!searchTerm.trim()) {
            console.log('[SEARCH DEBUG] No search term, returning all notifications');
            return notifications;
        }

        // Simple test first - just search the message
        const simpleFiltered = notifications.filter(notification => {
            const message = notification.message || '';
            const simpleMatch = message.toLowerCase().includes(searchTerm.toLowerCase());

            if (simpleMatch) {
                console.log('[SEARCH DEBUG] Simple match found in message:', message.substring(0, 100));
            }

            return simpleMatch;
        });

        console.log('[SEARCH DEBUG] Simple filtered results:', simpleFiltered.length);

        // If simple search doesn't work, there's a basic issue
        if (simpleFiltered.length === 0 && searchTerm === 'report') {
            console.log('[SEARCH DEBUG] WARNING: No matches for "report" - checking notification structure');
            notifications.forEach((notif, index) => {
                console.log(`[SEARCH DEBUG] Notification ${index}:`, {
                    id: notif._id,
                    type: notif.type,
                    message: notif.message,
                    hasMessage: !!notif.message,
                    messageType: typeof notif.message
                });
            });
        }

        const filtered = notifications.filter(notification => {
            const reportId = notification.reportId?._id || '';
            const shortId = reportId ? reportId.toString().slice(-4) : '';
            const message = notification.message || '';

            // Get notification title based on type
            let title = '';
            if (notification.type === 'status_change') {
                title = 'Report Status Update';
            } else if (notification.type === 'priority_change') {
                title = 'Flagged Report';
            }

            // Extract status and priority for enhanced search
            let status = '';
            let priority = '';

            if (notification.type === 'status_change') {
                if (notification.statusData?.newStatus) {
                    status = notification.statusData.newStatus;
                } else if (notification.message) {
                    const statusMatch = notification.message.match(/updated to:\s*(.+?)(?:\s+and\s|$)/i) ||
                        notification.message.match(/is now\s+(.+?)(?:\.\s|$)/i);
                    if (statusMatch) status = statusMatch[1].trim();
                }
            }

            if (notification.type === 'priority_change') {
                if (notification.statusData?.newPriority) {
                    priority = notification.statusData.newPriority;
                } else if (notification.message) {
                    if (notification.message.toLowerCase().includes('high')) priority = 'High';
                    if (notification.message.toLowerCase().includes('low')) priority = 'Low';
                }
            }

            // Search across multiple fields
            const matches = (
                title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shortId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (notification.type && notification.type.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return matches;
        });

        console.log('[SEARCH DEBUG] Full filtered results:', filtered.length);
        return filtered;
    };

    // Get filtered notifications using useMemo to ensure proper re-rendering
    const filteredNotifications = useMemo(() => {
        return filterNotifications(notifications);
    }, [notifications, searchTerm]);

    // Debug log to track state changes
    useEffect(() => {
        console.log('[COMPONENT DEBUG] Search term changed:', searchTerm);
        console.log('[COMPONENT DEBUG] Total notifications:', notifications.length);
        console.log('[COMPONENT DEBUG] Filtered notifications:', filteredNotifications.length);
    }, [searchTerm, notifications.length, filteredNotifications.length]);

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
    useEffect(() => {
        // Initialize horizontal scroll functionality
        const slider = document.querySelector('.report-horizontal');
        if (!slider) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const handleMouseDown = (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
            slider.classList.remove('active');
        };

        const handleMouseUp = () => {
            isDown = false;
            slider.classList.remove('active');
        };

        const handleMouseMove = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5;
            slider.scrollLeft = scrollLeft - walk;
        };

        slider.addEventListener('mousedown', handleMouseDown);
        slider.addEventListener('mouseleave', handleMouseLeave);
        slider.addEventListener('mouseup', handleMouseUp);
        slider.addEventListener('mousemove', handleMouseMove);

        // Cleanup event listeners
        return () => {
            slider.removeEventListener('mousedown', handleMouseDown);
            slider.removeEventListener('mouseleave', handleMouseLeave);
            slider.removeEventListener('mouseup', handleMouseUp);
            slider.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        const result = await markAsRead(notificationId);
        if (result.success) {
            // Refresh the unread count in the context
            refreshUnreadCount();
        } else {
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
                // Refresh the unread count in the context
                refreshUnreadCount();
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
            <SecNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <div className="dashboard-content">
                <div className="report-horizontal">
                    {announcementLoading ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            Loading announcements...
                        </div>
                    ) : announcementError ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                            Error loading announcements: {announcementError}
                        </div>
                    ) : announcements.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '2px dashed #ddd', borderRadius: '10px', width: '100%', marginRight: '20px' }}>
                            No announcements available.
                        </div>
                    ) : (
                        announcements.map((announcement) => (
                            <AnnouncementCard
                                key={announcement._id}
                                announcement={announcement}
                                currentUser={user}
                                onUpdate={handleUpdateAnnouncement}
                                onDelete={handleDeleteAnnouncement}
                            />
                        ))
                    )}
                </div>

                {/* Edit announcement modal */}
                {editingAnnouncement && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '500px'
                        }}>
                            <h3>Edit Announcement</h3>
                            <form onSubmit={handleFormSubmit}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Title:</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Description:</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            minHeight: '100px',
                                            resize: 'vertical'
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingAnnouncement(null);
                                            setFormData({ title: '', description: '' });
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            backgroundColor: '#f5f5f5',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
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
                    ) : filteredNotifications.length === 0 ? (
                        <div className="no-notifications-message">
                            <p>{searchTerm ? `No notifications found matching "${searchTerm}".` : 'No notifications found.'}</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => {
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