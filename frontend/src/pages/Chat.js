import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import useUserSearch from '../hooks/useUserSearch';
import useChatList from '../hooks/useChatList';
import ChatConversationCard from '../components/ChatConversationCard';
import NotificationIcon from '../components/NotificationIcon';
import UserSearchDropdown from '../components/UserSearchDropdown';
import '../assets/styles/Chat.css';
import '../assets/styles/UserSearch.css';
import '../assets/styles/ChatConversations.css';
import backgroundImage from '../assets/images/mainBackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
                    <h2>Chat</h2>
                </div>
            </div>
        </div>
    );
};

const Chat = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const { isConnected } = useSocket();
    const { conversations, loading, error, getProfileImageUrl } = useChatList();
    
    // Debug logging
    useEffect(() => {
        console.log('Chat component - conversations:', conversations);
        console.log('Chat component - loading:', loading);
        console.log('Chat component - error:', error);
        console.log('Chat component - isConnected:', isConnected);
    }, [conversations, loading, error, isConnected]);
    
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

    const renderConversations = () => {
        if (loading) {
            return (
                <div className="conversations-loading">
                    <p>Loading conversations...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="conversations-error">
                    <p>Error loading conversations: {error}</p>
                </div>
            );
        }

        if (conversations.length === 0) {
            return (
                <div className="chat-placeholder">
                    <h3>No conversations yet</h3>
                    <p>Search for users above to start a conversation</p>
                    <small>Type a username, email, or role to find people to chat with</small>
                </div>
            );
        }

        return (
            <div className="conversations-container">
                <div className="conversations-list">
                    {conversations.map((conversation) => (
                        <ChatConversationCard
                            key={conversation.user._id}
                            conversation={conversation}
                            getProfileImageUrl={getProfileImageUrl}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav />
            <div className="dashboard-content">
                <div className="chat-container" style={{ padding: '20px 20px 0px 0px' }}>
                    {renderConversations()}
                    
                    {/* Connection status indicator */}
                    <div className="connection-status" style={{ marginTop: '20px', textAlign: 'center' }}>
                        <div className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`} 
                             style={{ display: 'inline-block', marginRight: '8px' }}></div>
                        <span style={{ fontSize: '14px', color: isConnected ? '#28a745' : '#6c757d' }}>
                            {isConnected ? 'Connected to chat server' : 'Disconnected from chat server'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Chat;