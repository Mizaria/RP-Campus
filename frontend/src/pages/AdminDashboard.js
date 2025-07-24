import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReportCardAdmin } from '../components/reports/ReportCardAdmin';
import { ToastContainer } from '../components/common/Toast';
import NotificationIcon from '../components/NotificationIcon';
import useAdminDashboard from '../hooks/useAdminDashboard';
import useAdminReports from '../hooks/useAdminReports';
import useToast from '../hooks/useToast';
import '../assets/styles/AdminDashboard.css';
import backgroundImage from '../assets/images/adminmainbackground.svg'; // Adjust the path as necessary 

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ searchTerm, onSearchChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const currentDate = new Date();

  // Debug: Log user data to see if profileImage is included
  useEffect(() => {
    console.log('Dashboard user data:', user);
    console.log('API_BASE_URL:', API_BASE_URL);
    if (user?.profileImage) {
      console.log('Constructed image URL:', `${API_BASE_URL}/uploads/${user.profileImage}`);
    }
  }, [user]);

  const formattedDate = currentDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleLogout = () => {
    logout();
    // Use replace instead of regular navigate to ensure proper navigation
    navigate('/login', { replace: true });
  };

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
          <img src="images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
        </div>
        <div className="bar-item-modal" onClick={toggleModel}>
          <img src="images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
        </div>
        <div className="bar-search">
          <img src="images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
          <input 
            type="text" 
            placeholder="Search reports..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <NotificationIcon onClick={() => navigate('/notifications')} />
      </div>
      <div className="main-content">
        <div className="dashboard-title">
          <h2>Welcome back, <span style={{ color: '#E4BB1A' }}>{user?.username || 'User'}</span></h2>
          <p style={{ paddingTop: 4 }}>{formattedDate}</p>
        </div>
        <div className="main-right">
          <img src="images/Log Out Icon.svg" alt="Calendar Icon" className="calendar-icon" width="18px"
            height="18px" onClick={handleLogout}/>
          <div className="acc-frame">
            
            <img 
              src={user?.profileImage ? `${API_BASE_URL}/uploads/${user.profileImage}` : "images/Frame 47.svg"} 
              alt="Avatar" 
              className="acc-img"
              onError={(e) => {
                console.log('Image load error for URL:', e.target.src);
                console.log('Falling back to default');
                e.target.src = "images/Frame 47.svg";
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', user?.profileImage ? `${API_BASE_URL}/uploads/${user.profileImage}` : "default");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const  Dashboard = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Use the admin dashboard hook to fetch all reports
  const { 
    reports,
    loading, 
    error, 
    getHighPriorityReports,
    getLowPriorityReports,
    getReportCounts,
    refreshReports,
    updateReportInState,
    removeReportFromState
  } = useAdminDashboard();

  // Use admin reports hook for admin actions
  const {
    acceptReport,
    updateReportPriority,
    deleteReport: deleteReportAPI,
    isSubmitting
  } = useAdminReports();
  
  // Use toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // Filter reports based on search term and assignment status
  const filterReports = (reports) => {
    // First filter out assigned reports (only show unassigned reports)
    const unassignedReports = reports.filter(report => !report.assignedTo);
    
    // Then apply search filter if search term exists
    if (!searchTerm.trim()) return unassignedReports;
    
    return unassignedReports.filter(report => 
      (report.category && report.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.building && report.building.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.location && report.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.room && report.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report._id && report._id.toString().includes(searchTerm))
    );
  };
  
  // Get filtered report data
  const allHighPriorityReports = getHighPriorityReports();
  const allLowPriorityReports = getLowPriorityReports();
  const highPriorityReports = filterReports(allHighPriorityReports);
  const lowPriorityReports = filterReports(allLowPriorityReports);
  const reportCounts = getReportCounts();

  // Handle navigate to individual report
  const handleReportClick = (report) => {
    navigate(`/dashboard/report/${report._id}`);
  };

  // Handle accept report
  const handleAcceptReport = async (report) => {
    const result = await acceptReport(report._id);
    if (result.success) {
      // Update the report in state with the new data
      if (result.data && result.data.report) {
        updateReportInState(result.data.report);
      } else if (result.data) {
        updateReportInState(result.data);
      } else {
        // If no data returned, refresh all reports
        refreshReports();
      }
      showSuccess(result.message || 'Report accepted successfully!');
    } else {
      showError('Failed to accept report: ' + result.error);
    }
  };

  // Handle escalate (change priority to High)
  const handleEscalateReport = async (report) => {
    console.log('Escalating report:', report._id, 'from priority:', report.priority);
    const result = await updateReportPriority(report._id, 'High');
    if (result.success) {
      // Update the report in state
      if (result.data) {
        updateReportInState(result.data);
      } else {
        refreshReports();
      }
      showSuccess(result.message || 'Report escalated successfully!');
    } else {
      showError('Failed to escalate report: ' + result.error);
    }
  };

  // Handle de-escalate (change priority to Low)
  const handleDeEscalateReport = async (report) => {
    console.log('De-escalating report:', report._id, 'from priority:', report.priority);
    const result = await updateReportPriority(report._id, 'Low');
    if (result.success) {
      // Update the report in state
      if (result.data) {
        updateReportInState(result.data);
      } else {
        refreshReports();
      }
      showSuccess(result.message || 'Report de-escalated successfully!');
    } else {
      showError('Failed to de-escalate report: ' + result.error);
    }
  };

  // Handle delete report
  const handleDeleteReport = async (report) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const result = await deleteReportAPI(report._id);
      if (result.success) {
        // Remove the report from state
        removeReportFromState(report._id);
        showSuccess(result.message || 'Report deleted successfully!');
      } else {
        showError('Failed to delete report: ' + result.error);
      }
    }
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

  useEffect(() => {
    // Initialize horizontal scroll functionality
    const initializeHorizontalScroll = () => {
      const slider = document.querySelector('.report-horizontal');
      if (!slider) {
        console.log('Slider not found, retrying...');
        return;
      }

      console.log('Initializing horizontal scroll for:', slider);

      let isDown = false;
      let startX;
      let scrollLeft;

      const handleMouseDown = (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        slider.style.cursor = 'grabbing';
      };

      const handleMouseLeave = () => {
        isDown = false;
        slider.classList.remove('active');
        slider.style.cursor = 'grab';
      };

      const handleMouseUp = () => {
        isDown = false;
        slider.classList.remove('active');
        slider.style.cursor = 'grab';
      };

      const handleMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Increase scroll speed
        slider.scrollLeft = scrollLeft - walk;
      };

      // Remove any existing listeners first
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);

      // Add new listeners
      slider.addEventListener('mousedown', handleMouseDown);
      slider.addEventListener('mouseleave', handleMouseLeave);
      slider.addEventListener('mouseup', handleMouseUp);
      slider.addEventListener('mousemove', handleMouseMove);

      // Cleanup function
      return () => {
        slider.removeEventListener('mousedown', handleMouseDown);
        slider.removeEventListener('mouseleave', handleMouseLeave);
        slider.removeEventListener('mouseup', handleMouseUp);
        slider.removeEventListener('mousemove', handleMouseMove);
      };
    };

    // Try to initialize immediately
    const cleanup = initializeHorizontalScroll();
    
    // If slider wasn't found, try again after a short delay
    if (!cleanup) {
      const timer = setTimeout(() => {
        initializeHorizontalScroll();
      }, 100);
      
      return () => clearTimeout(timer);
    }

    return cleanup;
  }, [highPriorityReports]); // Re-run when reports change
  return (
    <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
      <SecNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="dashboard-content">
        <div className="dashboard-top-container">
          <div>
            <h2 className="page-title">Urgent Reports</h2>
            <div className="status-tab">
              <div className="urgent">
                <p>Urgent</p>
                <div className="tab-count">
                  <p>{reportCounts.high}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-message">Loading reports...</div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : (
          <>
            <div className="report-horizontal">
              {highPriorityReports.length === 0 ? (
                <div className="no-reports-message">No urgent reports at the moment</div>
              ) : (
                highPriorityReports.map((report) => (
                  <ReportCardAdmin
                    key={report._id}
                    report={report}
                    onClick={handleReportClick}
                    onAccept={handleAcceptReport}
                    onEscalate={handleEscalateReport}
                    onDeEscalate={handleDeEscalateReport}
                    onDelete={handleDeleteReport}
                    isSubmitting={isSubmitting}
                  />
                ))
              )}
            </div>
            
            <h2 className="page-title">Reports</h2>
            <div className="status-tab">
              <div className="available">
                <p>Available</p>
                <div className="tab-count">
                  <p>{reportCounts.low}</p>
                </div>
              </div>
            </div>
            <div className="report-vertical">
              {lowPriorityReports.length === 0 ? (
                <div className="no-reports-message">No reports available</div>
              ) : (
                lowPriorityReports.map((report) => (
                  <ReportCardAdmin
                    key={report._id}
                    report={report}
                    onClick={handleReportClick}
                    onAccept={handleAcceptReport}
                    onEscalate={handleEscalateReport}
                    onDeEscalate={handleDeEscalateReport}
                    onDelete={handleDeleteReport}
                    isSubmitting={isSubmitting}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
