import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import useChat from '../hooks/useChat';
import useUserSearch from '../hooks/useUserSearch';
import NotificationIcon from '../components/NotificationIcon';
import UserSearchDropdown from '../components/UserSearchDropdown';
import '../assets/styles/ChatMessage.css';
import '../assets/styles/UserSearch.css';
import backgroundImage from '../assets/images/mainBackground.svg';
// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ otherUser, isOnline }) => {
    const { user } = useAuth();
    const { getUserStatus, onlineUsers } = useSocket();
    const navigate = useNavigate();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    // Use the user search hook
    const {
        filteredUsers,
        searchQuery,
        loading,
        error,
        updateSearchQuery,
        clearSearch,
        getUserProfileImageUrl,
        formatUserRole
    } = useUserSearch();

    // Update online status when onlineUsers changes
    const [currentUserOnlineStatus, setCurrentUserOnlineStatus] = useState(isOnline);

    useEffect(() => {
        if (otherUser) {
            const newStatus = getUserStatus(otherUser._id) === 'online';
            setCurrentUserOnlineStatus(newStatus);
        }
    }, [onlineUsers, otherUser, getUserStatus]);

    const toggleNavbar = () => {
        setIsNavbarVisible(!isNavbarVisible);
        window.dispatchEvent(new CustomEvent('toggleNavbar', {
            detail: { isVisible: !isNavbarVisible }
        }));
    };

    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        updateSearchQuery(query);
        setIsSearchFocused(query.length > 0);
    };

    // Handle search input focus
    const handleSearchFocus = () => {
        // Show dropdown when focused, even if no query
        setIsSearchFocused(true);
    };

    // Handle user selection from dropdown
    const handleUserSelect = (selectedUser) => {
        console.log('Selected user:', selectedUser);

        // Clear the search and close dropdown
        clearSearch();
        setIsSearchFocused(false);

        // Navigate to chat with the selected user
        navigate(`/chat/${selectedUser._id}`);
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleModel = () => {
        window.dispatchEvent(new CustomEvent('toggleModal', {
            detail: { isOpen: true }
        }));
    };

    const getProfileImageUrl = (profileImage) => {
        if (profileImage) {
            return `${API_BASE_URL}/uploads/${profileImage}`;
        }
        return "/images/Frame 47.svg";
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
                    <div className="user-search-container">
                        <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                        />
                        <div ref={dropdownRef}>
                            <UserSearchDropdown
                                filteredUsers={filteredUsers}
                                loading={loading}
                                error={error}
                                isVisible={isSearchFocused}
                                onUserSelect={handleUserSelect}
                                getUserProfileImageUrl={getUserProfileImageUrl}
                                formatUserRole={formatUserRole}
                                getUserStatus={getUserStatus}
                                onlineUsers={onlineUsers}
                            />
                        </div>
                    </div>
                </div>
                <NotificationIcon onClick={() => navigate('/notifications')} />
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <div className="acc-frame">
                        <img
                            src={getProfileImageUrl(otherUser?.profileImage)}
                            alt="User Avatar"
                            className="acc-img"
                            onError={(e) => {
                                e.target.src = "/images/Frame 47.svg";
                            }}
                        />
                    </div>
                    <div className="user-status-header">
                        <p className='message-username'>{otherUser?.username || 'Loading...'}</p>
                        <div className={`status-indicator-header ${currentUserOnlineStatus ? 'status-online' : 'status-offline'}`}></div>
                        <span className="user-status-text">{currentUserOnlineStatus ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Message Item Component
const MessageItem = ({ message, isOwn, otherUser, currentUser, getImageUrl }) => {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getProfileImageUrl = (profileImage) => {
        if (profileImage) {
            return `${API_BASE_URL}/uploads/${profileImage}`;
        }
        return "/images/Frame 47.svg";
    };

    const userToShow = isOwn ? currentUser : otherUser;
    const isMessageRead = message.readBy && message.readBy.includes(currentUser?.id);

    return (
        <div
            className={`message-item ${isOwn ? 'sent' : 'received'}`}
            data-message-id={message._id}
            data-from-other={!isOwn}
            data-is-read={isMessageRead}
        >
            <img
                src={getProfileImageUrl(userToShow?.profileImage)}
                alt="Avatar"
                className="message-avatar"
                onError={(e) => {
                    e.target.src = "/images/Frame 47.svg";
                }}
            />
            <div className={`message-bubble ${isOwn ? 'sent' : 'received'}`} style={{
                backgroundColor: isOwn ? (currentUser?.role === 'admin' ? '#EFE9AF' : '#DDF1C6') : undefined
            }}>
                {message.type === 'image' && message.image ? (
                    <img
                        src={getImageUrl(message.image)}
                        alt="Message"
                        className="message-image"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                ) : null}

                {message.text && (
                    <p className="message-text">{message.text}</p>
                )}

                <div className="message-time">
                    {formatTime(message.createdAt)}
                </div>

                {isOwn && (
                    <div className="message-status">
                        <span className="read-indicator">
                            {(() => {
                                if (!message.readBy || message.readBy.length === 0) {
                                    return <span style={{ color: '#9E9E9E' }}>●</span>; // Sending
                                } else if (message.readBy.length === 1) {
                                    return <span style={{ color: '#9E9E9E' }}>✓</span>; // Delivered
                                } else {
                                    return <span style={{ color: '#4CAF50' }}>✓✓</span>; // Read
                                }
                            })()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatMessage = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const { getUserStatus, onlineUsers } = useSocket();
    const navigate = useNavigate();

    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Use the chat hook
    const {
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
        getImageUrl,
        markAsRead
    } = useChat(userId);

    // Check if the other user is online (updates when onlineUsers changes)
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (otherUser) {
            const newStatus = getUserStatus(otherUser._id) === 'online';
            setIsOnline(newStatus);
        }
    }, [onlineUsers, otherUser, getUserStatus]);

    // Listen for navbar toggle events
    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Mark unread messages as read when they come into view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId = entry.target.getAttribute('data-message-id');
                        const isFromOtherUser = entry.target.getAttribute('data-from-other') === 'true';
                        const isRead = entry.target.getAttribute('data-is-read') === 'true';

                        // Mark as read if it's from the other user and not already read
                        if (messageId && isFromOtherUser && !isRead) {
                            markAsRead(messageId);
                        }
                    }
                });
            },
            {
                threshold: 0.5, // Message is 50% visible
                rootMargin: '0px 0px -50px 0px' // Small margin to ensure message is actually visible
            }
        );

        // Observe all message elements
        const messageElements = document.querySelectorAll('.message-item[data-from-other="true"][data-is-read="false"]');
        messageElements.forEach((element) => {
            observer.observe(element);
        });

        return () => {
            observer.disconnect();
        };
    }, [messages, markAsRead, user?.id]);

    // Redirect if no userId provided
    useEffect(() => {
        if (!userId) {
            navigate('/chat');
        }
    }, [userId, navigate]);

    // Handle text message send
    const handleSendMessage = async () => {
        if (!messageText.trim() || sending) return;

        const text = messageText.trim();
        setMessageText('');
        await sendTextMessage(text);
    };

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        await sendImageMessage(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle input change with typing indicator
    const handleInputChange = (e) => {
        setMessageText(e.target.value);
        handleTyping();
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Render loading state
    if (loading) {
        return (
            <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
                <SecNav otherUser={null} isOnline={false} />
                <div className="dashboard-content" style={{ marginRight: isNavbarVisible ? '20px' : '0', overflow: 'visible' }}>
                    <div className='message-container'>
                        <div className="chat-loading">
                            Loading chat...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
                <SecNav otherUser={null} isOnline={false} />
                <div className="dashboard-content" style={{ marginRight: isNavbarVisible ? '20px' : '0', overflow: 'visible' }}>
                    <div className='message-container'>
                        <div className="chat-error">
                            <span>Error: {error}</span>
                            <button onClick={() => window.location.reload()}>Retry</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav otherUser={otherUser} isOnline={isOnline} />
            <div className="dashboard-content" style={{ marginRight: isNavbarVisible ? '20px' : '0', overflow: 'visible' }}>
                <div className='message-container'>
                    <div className="chat-window">
                        {messages.length === 0 ? (
                            <div className="empty-chat">
                                <span>No messages yet</span>
                                <small>Start the conversation by sending a message</small>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <MessageItem
                                    key={message._id}
                                    message={message}
                                    isOwn={message.senderId._id === user?.id}
                                    otherUser={otherUser}
                                    currentUser={user}
                                    getImageUrl={getImageUrl}
                                />
                            ))
                        )}
                        {isTyping && (
                            <div className="typing-indicator">
                                <div className="typing-dots">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-container">
                        {!isConnected && (
                            <div style={{
                                padding: '8px',
                                background: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                fontSize: '12px',
                                color: '#856404'
                            }}>
                                Connection lost. Trying to reconnect...
                            </div>
                        )}

                        <div className="chat-input-wrapper" style={{
                            '--focus-border-color': user?.role === 'admin' ? '#E9D674' : '#799C5F',
                            '--focus-border-color-rgb': user?.role === 'admin' ? '233, 214, 116' : '121, 156, 95'
                        }}>
                            <textarea
                                className="chat-input"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                disabled={sending || !isConnected}
                                rows={1}
                                style={{
                                    resize: 'none',
                                    overflow: 'hidden',
                                    minHeight: '20px',
                                    maxHeight: '100px'
                                }}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                            />

                            <div className="input-controls">
                                {/* File upload button */}
                                <button
                                    className="input-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sending || !isConnected}
                                    title="Upload image"
                                >
                                    <img src="/images/Plus.svg" alt="Upload" />
                                </button>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="file-input"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />

                                {/* Send button */}
                                <button
                                    className="input-btn send-btn"
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim() || sending || !isConnected}
                                    title="Send message"
                                    style={{
                                        backgroundColor: user?.role === 'admin' ? '#E9D674' : '#799C5F'
                                    }}
                                >
                                    <img src="/images/send.svg" alt="Send" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ChatMessage;