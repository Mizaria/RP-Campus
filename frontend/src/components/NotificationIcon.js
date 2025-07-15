import React from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';

const NotificationIcon = ({ className = 'bar-item', onClick = null }) => {
  const { unreadCount } = useNotificationContext();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      <img 
        src="/images/Notification Icon.svg" 
        alt="Notification Icon" 
        width="20px" 
        height="20px" 
      />
      {unreadCount > 0 && (
        <img 
          src="/images/Green Circle.svg" 
          alt="Notification Indicator" 
          className="notification-circle" 
        />
      )}
    </div>
  );
};

export default NotificationIcon;
