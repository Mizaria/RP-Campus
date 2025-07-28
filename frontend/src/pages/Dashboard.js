import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReportCard } from '../components/reports/ReportCard';
import NotificationIcon from '../components/NotificationIcon';
import useDashboardReports from '../hooks/useDashboardReports';
import '../assets/styles/Dashboard.css';

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
    <div className="mainBackground" style={{ backgroundImage: 'url(/images/mainBackground.svg)' }}>
      <div className="nav-bar">
        <div className="bar-item-menu" onClick={toggleNavbar}>
          <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
        </div>
        <div className="bar-item-modal" onClick={toggleModel}>
          <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
        </div>
        <div className="bar-search">
          <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
          <input 
            type="text" 
            placeholder="Search report..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <NotificationIcon onClick={() => navigate('/notifications')} />
      </div>
      <div className="main-content">
        <div className="dashboard-title">
          <h2>Welcome back, <span>{user?.username || 'User'}</span></h2>
          <p style={{ paddingTop: 4 }}>{formattedDate}</p>
        </div>
        <div className="main-right">
          <img src="/images/Log Out Icon.svg" alt="Calendar Icon" className="calendar-icon" width="18px"
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

const Dashboard = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Use the custom hook to fetch reports
  const { 
    loading, 
    error, 
    deleteReport, 
    getPendingAndInProgressReports,
    getResolvedReports,
    getReportCounts,
    fetchReports
  } = useDashboardReports();
  
  // Get report data
  const allPendingAndInProgressReports = getPendingAndInProgressReports();
  const allResolvedReports = getResolvedReports();
  const reportCounts = getReportCounts();

  // Filter reports based on search term
  const filterReports = (reports) => {
    if (!searchTerm.trim()) return reports;
    
    return reports.filter(report => 
      (report.category && report.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.building && report.building.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.location && report.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.room && report.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report._id && report._id.toString().includes(searchTerm)) ||
      (report.status && report.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Get filtered report data
  const pendingAndInProgressReports = filterReports(allPendingAndInProgressReports);
  const resolvedReports = filterReports(allResolvedReports);

  // Handle edit report
  const handleEditReport = (report) => {
    navigate(`/reports/${report._id}/edit`);
  };

  // Handle delete report
  const handleDeleteReport = async (report) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const result = await deleteReport(report._id);
      if (result.success) {
        console.log('Report deleted successfully');
      } else {
        alert('Failed to delete report: ' + result.error);
      }
    }
  };

  // Handle report card click to navigate to individual report
  const handleReportClick = (report) => {
    navigate(`/report/${report._id}`);
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
    const slider = document.querySelector('.report-horizontal');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      slider.classList.add('active');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const handleMouseUp = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mousemove', handleMouseMove);

    // Cleanup event listeners
    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  return (
    <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
      <SecNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <div className="dashboard-content">
        <div className="dashboard-top-container">
          <div>
            <h2 className="page-title">
              Report Progress
              {searchTerm && <span className="search-indicator"> - Search: "{searchTerm}"</span>}
            </h2>
            <div className="status-tab">
              <div className="pending">
                <p>Pending</p>
                <div className="tab-count">
                  <p>{reportCounts.pending}</p>
                </div>
              </div>
              <div className="in-progress">
                <p>In Progress</p>
                <div className="tab-count">
                  <p>{reportCounts.inProgress}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="create-button" onClick={() => navigate('/reports/new')}>
            <img src="images/White Create Icon.svg" alt="Create Icon" width="20px" height="20px" />
            <span>Create</span>
          </div>
        </div>
        <div className="report-horizontal">
          {loading ? (
            <div className="loading-message">
              <p>Loading reports...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>Error loading reports: {error}</p>
              <button onClick={fetchReports} className="retry-button">Retry</button>
            </div>
          ) : pendingAndInProgressReports.length === 0 ? (
            <div className="no-reports-message">
              <p>No pending or in-progress reports.</p>
            </div>
          ) : (
            pendingAndInProgressReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                onClick={handleReportClick}
              />
            ))
          )}
        </div>
        <h2 className="page-title">
          Report History
          {searchTerm && <span className="search-indicator"> - Search: "{searchTerm}"</span>}
        </h2>
        <div className="status-tab">
          <div className="resolved">
            <p>Resolved</p>
            <div className="tab-count">
              <p>{reportCounts.resolved}</p>
            </div>
          </div>
        </div>
        <div className="report-vertical">
          {loading ? (
            <div className="loading-message">
              <p>Loading resolved reports...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>Error loading reports: {error}</p>
              <button onClick={fetchReports} className="retry-button">Retry</button>
            </div>
          ) : resolvedReports.length === 0 ? (
            <div className="no-reports-message">
              <p>No resolved reports yet.</p>
            </div>
          ) : (
            resolvedReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                onClick={handleReportClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

