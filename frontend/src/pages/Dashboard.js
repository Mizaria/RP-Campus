import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/Dashboard.css';
import backgroundImage from '../assets/images/mainBackground.svg';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const currentDate = new Date();

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
    navigate('/login', { replace: true });
  };

  const toggleNavbar = () => {
    setIsNavbarVisible(!isNavbarVisible);
    window.dispatchEvent(new CustomEvent('toggleNavbar', {
      detail: { isVisible: !isNavbarVisible }
    }));
  };

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
          <input type="text" placeholder="Search report..." />
        </div>
        <div className="bar-item">
          <img src="images/Notification Icon.svg" alt="Notification Icon" width="20px" height="20px" />
          <img src="images/Green Circle.svg" alt="Notification Indicator" className="notification-circle" />
        </div>
      </div>
      <div className="main-content">
        <div className="dashboard-title">
          <h2>Welcome back, <span>{user?.username || 'User'}</span></h2>
          <p style={{ paddingTop: 4 }}>{formattedDate}</p>
        </div>
        <div className="main-right">
          <img src="images/Log Out Icon.svg" alt="Log Out Icon" className="calendar-icon" width="18px" height="18px" onClick={handleLogout} />
          <div className="acc-frame">
            <img
              src={user?.profileImage ? `${API_BASE_URL}/uploads/${user.profileImage}` : "images/Frame 47.svg"}
              alt="Avatar"
              className="acc-img"
              onError={(e) => { e.target.src = "images/Frame 47.svg"; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [reports, setReports] = useState([]);

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
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
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

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
      <SecNav />
      <div className="dashboard-content">
        <div className="dashboard-top-container">
          <div>
            <h2 className="page-title">Report Progress</h2>
            <div className="status-tab">
              <div className="pending">
                <p>Pending</p>
                <div className="tab-count">
                  <p>{reports.filter(r => r.status === 'Pending').length}</p>
                </div>
              </div>
              <div className="in-progress">
                <p>In Progress</p>
                <div className="tab-count">
                  <p>{reports.filter(r => r.status === 'In Progress').length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="create-button">
            <img src="images/White Create Icon.svg" alt="Create Icon" width="20px" height="20px" />
            <span>Create</span>
          </div>
        </div>

        <div className="report-horizontal">
          {reports
            .filter(r => r.status === 'Pending' || r.status === 'In Progress')
            .map((report) => (
              <div key={report._id} className="report-card">
                <div className="report-top-bot">
                  <div className="report-top-left">
                    <span className="status-circle" style={{ backgroundColor: report.status === 'Pending' ? '#A7A7A7' : '#F0B429' }}></span>
                    <p className="report-id">#{report._id.slice(-4)}</p>
                  </div>
                  <div className="main-right">
                    <li>
                      <img src="images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px" height="22px" />
                      <ul className="dropdown">
                        <li><img src="images/edit.svg" alt="Edit Icon" className="dropdown-icon" width="22px" height="22px" />Edit</li>
                        <li><img src="images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px" height="22px" />Delete</li>
                      </ul>
                    </li>
                  </div>
                </div>
                <div className="report-info-main">
                  <p className="report-info-title">{report.category} Issue</p>
                  <p className="report-sub-text">{report.description}</p>
                </div>
                <div className="report-info-sub">
                  <p className="report-sub-text"><span className="light-bold">Assigned to:</span> {report.assignedTo?.username || '???'}</p>
                </div>
                <div className="report-top-bot">
                  <div className="report-location" style={{ backgroundColor: '#EAE0D8' }}>
                    <p className="report-sub-text">{report.room || 'Unknown'}</p>
                  </div>
                  <p className="report-date">{new Date(report.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            ))}
        </div>

        <h2 className="page-title">Report History</h2>
        <div className="status-tab">
          <div className="resolved">
            <p>Resolved</p>
            <div className="tab-count">
              <p>{reports.filter(r => r.status === 'Resolved').length}</p>
            </div>
          </div>
        </div>

        <div className="report-vertical">
          {reports
            .filter(r => r.status === 'Resolved')
            .map((report) => (
              <div key={report._id} className="report-card">
                <div className="report-top-bot">
                  <div className="report-top-left">
                    <span className="status-circle" style={{ backgroundColor: '#76BB3F' }}></span>
                    <p className="report-id">#{report._id.slice(-4)}</p>
                  </div>
                  <div className="main-right">
                    <li>
                      <img src="images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px" height="22px" />
                      <ul className="dropdown">
                        <li><img src="images/edit.svg" alt="Edit Icon" className="dropdown-icon" width="22px" height="22px" />Edit</li>
                        <li><img src="images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px" height="22px" />Delete</li>
                      </ul>
                    </li>
                  </div>
                </div>
                <div className="report-info-main">
                  <p className="report-info-title">{report.category} Issue</p>
                  <p className="report-sub-text">{report.description}</p>
                </div>
                <div className="report-info-sub">
                  <p className="report-sub-text"><span className="light-bold">Assigned to:</span> {report.assignedTo?.username || '???'}</p>
                  <p className="report-sub-text"><span className="light-bold">Resolved In:</span> {new Date(report.updatedAt).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="report-top-bot">
                  <div className="report-location" style={{ backgroundColor: '#EAE0D8' }}>
                    <p className="report-sub-text">{report.room || 'Unknown'}</p>
                  </div>
                  <p className="report-date">{new Date(report.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

