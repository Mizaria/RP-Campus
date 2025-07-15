import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileEdit.css';
import '../assets/styles/Dashboard.css';
import '../assets/styles/ProfileStyles.css';
import Navbar from '../components/Navbar';
import NotificationIcon from '../components/NotificationIcon';
import useProfile from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import backgroundImage from '../assets/images/mainBackground.svg';
import adminBackgroundImage from '../assets/images/adminmainbackground.svg';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { profileData, updateProfileImage } = useProfile();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data with existing profile data
  useEffect(() => {
    if (profileData) {
      // Split username into first and last name if it exists
      const nameParts = profileData.username ? profileData.username.split(' ') : ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: profileData.email || '',
        phone: user?.phone || '',
        password: ''
      });
      
      if (profileData.profileImage) {
        setImagePreview(`http://localhost:3000/uploads/${profileData.profileImage}`);
      }
    }
  }, [profileData, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous errors
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare update data
      const updateData = {
        username: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      // Update profile data
      const response = await authAPI.updateProfile(updateData);
      
      // Update profile image if a new one was selected
      if (profileImage) {
        await updateProfileImage(profileImage);
      }

      // Update user context - backend returns { success: true, user: {...} }
      if (response && response.user) {
        updateUser(response.user);
      }
      
      setSuccess('Profile updated successfully!');
      
      // Redirect back to profile page after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const isAdmin = user?.role === 'admin';

  const toggleNavbar = () => {
    // Dispatch custom event to toggle navbar
    window.dispatchEvent(new CustomEvent('toggleNavbar', {
      detail: { isVisible: true }
    }));
  };

  return (
    <div className="profile-page">
      <div className="dashboard">
        <Navbar />
        
        <div 
          className="mainBackground" 
          style={{ 
            backgroundImage: `url(${isAdmin ? adminBackgroundImage : backgroundImage})` 
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
          <NotificationIcon onClick={() => navigate('/notifications')} />
        </div>

        {/* Profile Content Overlay */}
        <div className="profile-overlay">
          <div className="profile-content">
            {/* Profile Image Circle */}
            <div className="profile-circle">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '50%', 
                    objectFit: 'cover' 
                  }}
                />
              ) : (
                <img 
                  src="/images/noimg 1.svg" 
                  alt="No profile" 
                  style={{ width: '80px', height: '80px' }}
                />
              )}
              
              {/* Hidden file input */}
              <input
                type="file"
                id="profile-image-input"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              
              {/* Camera overlay for image upload */}
              <div 
                className="image-upload-overlay"
                onClick={() => document.getElementById('profile-image-input').click()}
              >
                <img src="/images/imageupload 1.svg" alt="Upload" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="profile-form-container">
          {/* Profile Form */}
          <form className="profile-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{ 
                color: '#d32f2f', 
                marginBottom: '20px', 
                textAlign: 'center',
                padding: '10px',
                backgroundColor: '#ffebee',
                borderRadius: '8px'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message" style={{ 
                color: '#2e7d32', 
                marginBottom: '20px', 
                textAlign: 'center',
                padding: '10px',
                backgroundColor: '#e8f5e8',
                borderRadius: '8px'
              }}>
                {success}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">New Password (optional)</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter new password to change"
                />
              </div>
              <div className="form-group">
                {/* Empty div to maintain two-column layout */}
              </div>
            </div>

            <div className="form-actions" style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center', 
              marginTop: '30px' 
            }}>
              <button
                type="button"
                onClick={handleCancel}
                className="cancel-button"
                style={{
                  padding: '12px 30px',
                  border: '2px solid #41840D',
                  backgroundColor: 'transparent',
                  color: '#41840D',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Sen, sans-serif'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="save-button"
                style={{
                  padding: '12px 30px',
                  border: 'none',
                  backgroundColor: '#41840D',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'Sen, sans-serif'
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfileEdit;
