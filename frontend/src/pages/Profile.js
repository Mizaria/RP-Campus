import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useProfile from '../hooks/useProfile';
import NotificationIcon from '../components/NotificationIcon';
import '../assets/styles/Dashboard.css';
import '../assets/styles/ProfileStyles.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { profileData, loading, error, refreshProfile, updateProfileImage } = useProfile();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const getProfileImageUrl = () => {
    if (profileData.profileImage) {
      return `${API_BASE_URL}/uploads/${profileData.profileImage}`;
    }
    // Use default avatar from public images folder
    return '/images/Frame 47.svg';
  };

  const formatRole = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleNavbar = () => {
    setIsNavbarVisible(!isNavbarVisible);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Debug: Log profile data
  console.log('Profile Data:', profileData);
  console.log('Profile Stats:', profileData.stats);

  return (
    <div className="profile-page">
      {/* Navigation Menu */}
      <div className={`nav-menu${user?.role === 'admin' ? ' admin' : ''} ${isNavbarVisible ? 'visible' : 'hidden'}`}>
        <div 
          className="navBackground"
          style={{
            backgroundImage: `url(${user?.role === 'admin' ? '/images/adminmainbackground.svg' : '/images/mainBackground.svg'})`
          }}
        >
          <div className="nav-box">
            <div className="nav-container">
              <div className="nav-title">
                <img src="/images/Logo.png" alt="RP Campus Care Logo" className="nav-logo" />
                <p className="nav-text-title">Campus Care</p>
              </div>
              <div className="nav-create" onClick={() => handleNavigation('/reports/new')}>
                <img src="/images/Plus.svg" alt="Create Icon" className="nav-icon" width="20px" height="20px" />
                <p className="nav-text">Create</p>
              </div>
              <div className="nav-items" onClick={() => handleNavigation('/dashboard')}>
                <img src="/images/Dashboard Icon.svg" alt="Dashboard Icon" className="nav-icon" width="20px" height="20px" />
                <p className="nav-text">Dashboard</p>
              </div>
              {/* Show My Tasks for admin, My Reports for student/staff */}
              {user?.role === 'admin' ? (
                <div className="nav-items" onClick={() => handleNavigation('/mytasks')}>
                  <img src="/images/My Reports Icon.svg" alt="My Tasks Icon" className="nav-icon" width="20px" height="20px" />
                  <p className="nav-text">My Tasks</p>
                </div>
              ) : (
                <div className="nav-items" onClick={() => handleNavigation('/reports')}>
                  <img src="/images/My Reports Icon.svg" alt="My Reports Icon" className="nav-icon" width="20px" height="20px" />
                  <p className="nav-text">My Reports</p>
                </div>
              )}
              {/* Show History only for admin */}
              {user?.role === 'admin' && (
                <div className="nav-items" onClick={() => handleNavigation('/history')}>
                  <img src="/images/Timemachine.svg" alt="History Icon" className="nav-icon" width="20px" height="20px" />
                  <p className="nav-text">History</p>
                </div>
              )}
              <div className="nav-items active" onClick={() => handleNavigation('/profile')}>
                <img src="/images/Account Icon.svg" alt="Account Icon" className="nav-icon" width="20px" height="20px" />
                <p className="nav-text">Account</p>
              </div>
              <div className="nav-items" onClick={() => handleNavigation('/notifications')}>
                <img src="/images/Notification Icon.svg" alt="Notification Icon" className="nav-icon" width="20px" height="20px" />
                <p className="nav-text">Notification</p>
              </div>
              <div className="nav-items" onClick={() => handleNavigation('/chat')}>
                <img src="/images/Chat Icon.svg" alt="Chat Icon" className="nav-icon" width="20px" height="20px" />
                <p className="nav-text">Chat</p>
              </div>
              <div className="nav-items" onClick={handleLogout}>
                <img src="/images/Log Out Icon.svg" alt="Logout Icon" className="nav-icon" width="20px" height="20px" />
                <p className="nav-text">Logout</p>
              </div>
            </div>
          </div>
          <div className="nav-box-holder"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard">
        <div 
          className="mainBackground" 
          style={{ 
            backgroundImage: `url(${user?.role === 'admin' ? '/images/adminmainbackground.svg' : '/images/mainBackground.svg'})` 
          }}
        >
          {/* Top Navigation Bar */}
          <div className="nav-bar">
            <div className="bar-item" onClick={toggleNavbar}>
              <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
            </div>
            <div className="bar-search">
              <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
              <input type="text" placeholder="Search report..." />
            </div>
            <NotificationIcon onClick={() => handleNavigation('/notifications')} />
          </div>

          {/* Main Content Header */}
          <div className="main-content">
            <div className="dashboard-title">
            
            </div>
            <div className="main-right">
              <img 
                src="/images/Log Out Icon.svg" 
                alt="Logout Icon" 
                className="calendar-icon" 
                width="18px" 
                height="18px" 
                onClick={handleLogout}
                style={{ cursor: 'pointer' }}
              />
              <div className="acc-frame">
                <img src={getProfileImageUrl()} alt="Avatar" className="acc-img" />
              </div>
            </div>
          </div>

          {/* Profile Content Overlay */}
          <div className="profile-overlay">
            <div className="profile-main-avatar">
              <img src={getProfileImageUrl()} alt="Profile Avatar" className="main-profile-img" />
            </div>
            
            <div className="profile-name-section">
              <h3 className="profile-name">{profileData.username}</h3>
              <img 
                src="/images/edit.svg" 
                alt="Edit" 
                className="edit-icon" 
                onClick={handleEditProfile}
              />
            </div>
            <p className="profile-email">{profileData.email}</p>
            <p className="profile-role">{formatRole(profileData.role)}</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="dashboard-content">
          <div className="profile-stats-container">
            <div className="profile-stats">
              <div className="stats-card">
                <div className="stat-item">
                  <img src="/images/ResultsIcon.svg" alt="Total Reports" className="stat-icon" />
                  <div className="stat-info">
                    <h4>Total Reports</h4>
                    <p className="stat-number">{profileData.stats.totalReports || 0}</p>
                  </div>
                </div>
                <div className="stat-item">
                  <img src="/images/UnresolvedIcon.svg" alt="Pending Reports" className="stat-icon" />
                  <div className="stat-info">
                    <h4> Total Pending Reports</h4>
                    <p className="stat-number">{profileData.stats.pendingReports || 0}</p>
                  </div>
                </div>
                <div className="stat-item">
                  <img src="/images/ResolvedIcon.svg" alt="Resolved Reports" className="stat-icon" />
                  <div className="stat-info">
                    <h4>Total Resolved Reports</h4>
                    <p className="stat-number">{profileData.stats.resolvedReports || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;