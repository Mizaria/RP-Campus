import React from 'react';

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

export default UserSearchDropdown;
