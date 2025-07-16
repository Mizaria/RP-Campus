import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import useUserSearch from '../hooks/useUserSearch';
import '../assets/styles/Chat.css';
import '../assets/styles/UserSearch.css';
import backgroundImage from '../assets/images/mainBackground.svg';
import adminbackgroundImage from '../assets/images/adminmainbackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// UserSearchDropdown component
const UserSearchDropdown = ({ 
    filteredUsers, 
    loading, 
    error, 
    isVisible, 
    onUserSelect, 
    getUserProfileImageUrl, 
    formatUserRole,
    getUserStatus,
    onlineUsers
}) => {
    if (!isVisible) return null;

    if (loading) {
        return (
            <div className="user-search-results">
                <div className="search-loading">
                    <span>Searching users...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-search-results">
                <div className="search-error">
                    <span>Error: {error}</span>
                </div>
            </div>
        );
    }

    if (filteredUsers.length === 0) {
        return (
            <div className="user-search-results">
                <div className="search-no-results">
                    {loading ? (
                        <span>Loading users...</span>
                    ) : error ? (
                        <span>Error loading users</span>
                    ) : (
                        <>
                            <span>No users found</span>
                            <small>Try searching with a different term</small>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="user-search-results" key={onlineUsers?.size || 0}>
            {filteredUsers.map((user) => (
                <div 
                    key={user._id} 
                    className="user-search-item"
                    onClick={() => onUserSelect(user)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onUserSelect(user);
                        }
                    }}
                >
                    <img 
                        src={getUserProfileImageUrl(user.profileImage)} 
                        alt={`${user.username}'s avatar`}
                        className="user-avatar"
                        onError={(e) => {
                            e.target.src = '/images/Frame 47.svg';
                        }}
                    />
                    <div className="user-info">
                        <p className="user-name">{user.username}</p>
                        <p className={`user-role role-${user.role}`}>
                            {formatUserRole(user.role)}
                        </p>
                    </div>
                    <div className="user-status">
                        {(() => {
                            // Always use real-time status from getUserStatus, ignore cached user.status
                            const status = getUserStatus(user._id) || 'offline';
                            const isOnline = status === 'online';
                            return (
                                <>
                                    <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}></div>
                                    <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
                                </>
                            );
                        })()}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SecNav = () => {
    const { user } = useAuth();
    const { getUserStatus, isConnected, onlineUsers } = useSocket();
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

    // Debug: Log user data to see if profileImage is included
    useEffect(() => {
        console.log('Dashboard user data:', user);
        console.log('API_BASE_URL:', API_BASE_URL);
        if (user?.profileImage) {
            console.log('Constructed image URL:', `${API_BASE_URL}/uploads/${user.profileImage}`);
        }
    }, [user]);

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
                <div className="bar-item">
                    <img src="/images/Notification Icon.svg" alt="Notification Icon" width="20px" height="20px" />
                    <img src="/images/Green Circle.svg" alt="Notification Indicator" className="notification-circle" />
                </div>
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>Chat</h2>
                </div>
            </div>
        </div>
    );
};
const Chat = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const { isConnected } = useSocket();
    
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

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav />
            <div className="dashboard-content">
                <div className="chat-container">
                    <div className="chat-placeholder">
                        <h3>Welcome to Chat</h3>
                        <p>Search for users above to start a conversation</p>
                        <small>Type a username, email, or role to find people to chat with</small>
                        
                        {/* Connection status indicator */}
                        <div className="connection-status" style={{ marginTop: '20px' }}>
                            <div className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`} 
                                 style={{ display: 'inline-block', marginRight: '8px' }}></div>
                            <span style={{ fontSize: '14px', color: isConnected ? '#28a745' : '#6c757d' }}>
                                {isConnected ? 'Connected to chat server' : 'Disconnected from chat server'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Chat;