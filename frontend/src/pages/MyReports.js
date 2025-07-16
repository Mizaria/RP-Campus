import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReportCard } from '../components/reports/ReportCard';
import NotificationIcon from '../components/NotificationIcon';
import useMyReport from '../hooks/useMyReport';
import '../assets/styles/MyReports.css';
import backgroundImage from '../assets/images/mainBackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ currentSort, handleSortChange, searchTerm, onSearchChange }) => {
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
            placeholder="Search report..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <NotificationIcon onClick={() => navigate('/notifications')} />
      </div>
      <div className="main-content">
        <div className="Page-header">
          <h2>My Reports</h2>
          <div className="main-right">
            <li>
              <img src="images/Descending Sorting.svg" alt="Arrow Icon" width="20px" height="20px" />
              <ul className="dropdown">
                <li onClick={() => handleSortChange('All')}>
                  <a>All{currentSort === 'All' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Location')}>
                  <a>Location{currentSort === 'Location' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Problem')}>
                  <a>Problem{currentSort === 'Problem' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Status')}>
                  <a>Status{currentSort === 'Status' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Created')}>
                  <a>Created{currentSort === 'Created' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
              </ul>
            </li>
          </div>
        </div>
        <div className="create-button" onClick={() => navigate('/reports/new')}>
          <img src="images/White Create Icon.svg" alt="Create Icon" width="20px" height="20px" />
          <span>Create</span>
        </div>
      </div>
    </div>
  );
};

const MyReport = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [currentSort, setCurrentSort] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Use the custom hook to fetch reports
  const { 
    reports, 
    loading, 
    error, 
    deleteReport, 
    getReportCounts, 
    fetchReports 
  } = useMyReport();
  
  // Get report counts for the status tabs
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

  // Sort reports based on current sort option
  const getSortedReports = () => {
    let sortedReports = [...reports];
    
    switch (currentSort) {
      case 'Location':
        sortedReports.sort((a, b) => {
          const locationA = `${a.building}${a.location}${a.room}`.toLowerCase();
          const locationB = `${b.building}${b.location}${b.room}`.toLowerCase();
          return locationA.localeCompare(locationB);
        });
        break;
      case 'Problem':
        sortedReports.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'Status':
        sortedReports.sort((a, b) => {
          const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Resolved': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
      case 'Created':
        sortedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'All':
      default:
        // Default sorting by status (Pending -> In Progress -> Resolved)
        sortedReports.sort((a, b) => {
          const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Resolved': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
    }
    
    // Apply search filter after sorting
    return filterReports(sortedReports);
  };

  // Handle sort option selection
  const handleSortChange = (sortOption) => {
    setCurrentSort(sortOption);
  };

  // Handle edit report
  const handleEditReport = (report) => {
    // Navigate to edit page with report data
    navigate(`/reports/${report._id}/edit`);
  };

  // Handle delete report
  const handleDeleteReport = async (report) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const result = await deleteReport(report._id);
      if (result.success) {
        // Optionally show success message
        console.log('Report deleted successfully');
      } else {
        // Show error message
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
      <SecNav 
        currentSort={currentSort} 
        handleSortChange={handleSortChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <div className="dashboard-content">

        <h2 className="page-title">
          Report Progress
          {searchTerm && <span className="search-indicator"> - Search: "{searchTerm}"</span>}
        </h2>
        <div className="report-horizontal-my">
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
            <div className="resolved">
              <p>Resolved</p>
              <div className="tab-count">
                <p>{reportCounts.resolved}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="report-vertical">
          {loading ? (
            <div className="loading-message">
              <p>Loading your reports...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>Error loading reports: {error}</p>
              <button onClick={fetchReports} className="retry-button">
                Retry
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="no-reports-message">
              <p>No reports found. Create your first report!</p>
            </div>
          ) : (
            getSortedReports().map((report) => (
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

export default MyReport;
