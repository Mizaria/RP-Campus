import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const ChatConversationCard = ({ conversation, getProfileImageUrl }) => {
    const navigate = useNavigate();
    const { getUserStatus } = useSocket();
    
    const { user, lastMessage, unreadCount } = conversation;
    
    // Get real-time user status
    const userStatus = getUserStatus(user._id) || 'offline';
    const isOnline = userStatus === 'online';

    const handleCardClick = () => {
        navigate(`/chat/${user._id}`);
    };

    const formatUserRole = (role) => {
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
    };

    const formatTimestamp = (timestamp) => {
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
    };

    const getLastMessagePreview = () => {
        if (!lastMessage) return 'No messages yet';
        
        if (lastMessage.type === 'image') {
            return '📷 Image';
        }
        
        return lastMessage.text || 'Message';
    };

    return (
        <div 
            className="conversation-card"
            onClick={handleCardClick}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick();
                }
            }}
        >
            <div className="conversation-avatar">
                <img 
                    src={getProfileImageUrl(user.profileImage)} 
                    alt={`${user.username}'s avatar`}
                    onError={(e) => {
                        e.target.src = '/images/Frame 47.svg';
                    }}
                />
                <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}></div>
            </div>
            
            <div className="conversation-info">
                <div className="conversation-header">
                    <h4 className="user-name">{user.username}</h4>
                    <span className="last-message-time">
                        {lastMessage ? formatTimestamp(lastMessage.createdAt) : ''}
                    </span>
                </div>
                
                <div className="conversation-details">
                    <p className={`user-role role-${user.role}`}>
                        {formatUserRole(user.role)}
                    </p>
                    <div className="status-info">
                        <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
                
                <div className="last-message-preview">
                    <span className="message-text">{getLastMessagePreview()}</span>
                    {unreadCount > 0 && (
                        <span className={`unread-badge ${user.role === 'admin' ? 'admin' : ''}`}>{unreadCount}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatConversationCard;
