import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useReportUpdate from '../hooks/useReportUpdate';
import '../assets/styles/ReportForm.css';
import backgroundImage from '../assets/images/mainBackground.svg';

// Image Upload Modal Component
const ImageUploadModal = ({ isOpen, onClose, onImageUpload }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay-update" 
      onClick={onClose}
    >
      <div 
        className="modal-content-update" 
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="img-add-container">
          <img
            src="/images/imageupload 1.svg"
            alt="Add Image Icon"
            className="add-image-icon"
            width="130px"
          />
          <p className="add-image-text">Image of fault (optional)</p>
          <div className="line-divider"></div>
          <div className="image-btn-container">
            <label htmlFor="fileInput" className="image-input">
              <img
                src="/images/Plus.svg"
                alt="Upload Icon"
                className="upload-icon"
                width="15px"
                height="15px"
              />
              Upload
            </label>
            <input 
              type="file" 
              id="fileInput" 
              accept="image/*"
              onChange={onImageUpload}
              style={{ display: "none" }} 
            />
            <label htmlFor="cameraInput" className="image-input">
              Use Camera
            </label>
            <input
              type="file"
              id="cameraInput"
              accept="image/*"
              capture="environment"
              onChange={onImageUpload}
              className="image-input"
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};




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
    <div className="mainBackground" style={{ backgroundImage: `url(${backgroundImage})` }}>
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
          <h2>Update Report</h2>
        </div>
      </div>
    </div>
  );
};
const ReportUpdate = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use the custom hook for report update logic
  const {
    formData,
    originalReport,
    uploadedImage,
    imagePreview,
    isSubmitting,
    isLoading,
    errors,
    handleInputChange,
    handleImageUpload,
    removeImage,
    updateReport,
    navigate
  } = useReportUpdate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await updateReport();
    
    if (result.success) {
      alert(result.message);
      navigate('/myreports');
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleImageUploadWithModal = (e) => {
    handleImageUpload(e);
    // Close modal after upload
    setIsModalOpen(false);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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

  // Show loading state
  if (isLoading) {
    return (
      <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
        <SecNav />
        <div className="dashboard-content">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            gap: '20px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ fontSize: '18px', color: '#666' }}>Loading report data...</p>
            <p style={{ fontSize: '14px', color: '#999' }}>
              If this takes too long, please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no report data
  if (!originalReport) {
    return (
      <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
        <SecNav />
        <div className="dashboard-content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <p>Report not found or cannot be updated.</p>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
      <SecNav />
      <div className="dashboard-content">
        <form className="report-info-container" onSubmit={handleSubmit}>
          <div className="report-left">
            <div className="fault-Location">
              <p className="report-info-title">Fault Location</p>
              <label htmlFor="reportBuilding"></label>
              <input
                type="text"
                id="reportBuilding"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
                placeholder="Building name..."
                required
                className="report-fields"
              />
              {errors.building && <span className="error-message" style={{color: 'red', fontSize: '12px'}}>{errors.building}</span>}
              <label htmlFor="reportFloor"></label>
              <input
                type="text"
                id="reportFloor"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Floor..."
                required
                className="report-fields"
              />
              {errors.location && <span className="error-message" style={{color: 'red', fontSize: '12px'}}>{errors.location}</span>}
              <label htmlFor="reportRoom"></label>
              <input
                type="text"
                id="reportRoom"
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                placeholder="Room..."
                required
                className="report-fields"
              />
              {errors.room && <span className="error-message" style={{color: 'red', fontSize: '12px'}}>{errors.room}</span>}
            </div>
            <div className="fault-des">
              <p className="report-info-title">Fault Information</p>
              <label htmlFor="reportCategory"></label>
              <select 
                id="reportCategory" 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Select Category...
                </option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="IT">IT</option>
                <option value="Furniture">Furniture</option>
                <option value="Equipment">Equipment</option>
                <option value="Sanitation">Sanitation</option>
              </select>
              {errors.category && <span className="error-message" style={{color: 'red', fontSize: '12px'}}>{errors.category}</span>}
              
              <label htmlFor="reportDes"></label>
              <textarea
                id="reportDes"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description of the fault.... "
                required
                minLength="10"
              ></textarea>
              {errors.description && <span className="error-message" style={{color: 'red', fontSize: '12px'}}>{errors.description}</span>}
            </div>
          </div>
          <div className="report-right">
            <div className="report-image-container">
              {imagePreview ? (
                // Show uploaded image
                <div className="image-present">
                  <img
                    src={imagePreview}
                    alt="Uploaded report"
                    className="report-image"
                    height="100%"
                  />
                  <img
                    src="/images/update.svg"
                    alt="update Icon"
                    className="update-icon"
                    width="35px"
                    height="35px"
                    onClick={toggleModal}
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="remove-image-btn"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                // Show upload interface
                <div className="img-add-container">
                  <img
                    src="/images/imageupload 1.svg"
                    alt="Add Image Icon"
                    className="add-image-icon"
                    width="130px"
                  />
                  <p className="add-image-text">Image of fault (optional)</p>
                  <div className="line-divider"></div>
                  <div className="image-btn-container">
                    <label htmlFor="directFileInput" className="image-input">
                      <img
                        src="/images/Plus.svg"
                        alt="Upload Icon"
                        className="upload-icon"
                        width="15px"
                        height="15px"
                      />
                      Upload
                    </label>
                    <input 
                      type="file" 
                      id="directFileInput" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }} 
                    />
                    <label htmlFor="directCameraInput" className="image-input">
                      Use Camera
                    </label>
                    <input
                      type="file"
                      id="directCameraInput"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="button-container">
              <button 
                className="create-btn" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Image Upload Modal */}
      <ImageUploadModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onImageUpload={handleImageUploadWithModal}
      />
    </div>
  );
};


export default ReportUpdate;
