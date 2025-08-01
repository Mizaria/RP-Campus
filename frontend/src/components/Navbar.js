import React, { useState, useEffect } from 'react';
// import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationIcon from './NotificationIcon';
import '../assets/styles/Navbar.css'; // Import your custom CSS for the navbar
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleToggleNavbar = (event) => {
      setIsVisible(event.detail.isVisible);
    };

    const handleToggleModal = (event) => {
      setIsModalOpen(event.detail.isOpen);
    };

    window.addEventListener('toggleNavbar', handleToggleNavbar);
    window.addEventListener('toggleModal', handleToggleModal);

    return () => {
      window.removeEventListener('toggleNavbar', handleToggleNavbar);
      window.removeEventListener('toggleModal', handleToggleModal);
    };
  }, []);

  const handleLogout = () => {
    closeModal(); // Close modal first if it's open
    logout();
    // Use replace instead of regular navigate to ensure proper navigation
    navigate('/login', { replace: true });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Notify other components that modal is closed
    window.dispatchEvent(new CustomEvent('toggleModal', {
      detail: { isOpen: false }
    }));
  };

  if (!user) {
    return null; // Don't show navbar if user is not logged in
  }
  const navbarClasses = `nav-menu${user?.role === 'admin' ? ' admin' : ''}${!isVisible ? ' nav-hidden' : ''}`;
  const modalClasses = `modal-overlay${user?.role === 'admin' ? ' admin' : ''}${!isVisible ? ' nav-hidden' : ''}`;
  return (
    <>
      <div className={navbarClasses}>
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
               {user?.role === 'admin' ? (
              <div className="nav-create" onClick={() => navigate('/announcement-form')}>
                  <img src="/images/Plus.svg" alt="Create Icon" className="nav-icon" style={{ height: 20, width: 20 }} />
                  <p className="nav-text">Announce</p>
                </div>
              ) : (
                <div className="nav-create" onClick={() => navigate('/reports/new')}>
                <img src="/images/Plus.svg" alt="Create Icon" className="nav-icon" style={{ height: 20, width: 20 }} />
                <p className="nav-text">Create</p>
              </div>
              )}
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Dashboard Icon.svg" className="nav-icon" alt='Dashboard' width="20px"
                  height="20px" />
                <p className="nav-text">Dashboard</p>
              </NavLink>
              {/* Show My Tasks for admin, My Reports for student/staff */}
              {user?.role === 'admin' ? (
                <NavLink
                  to="/mytasks"
                  className={({ isActive }) =>
                    `nav-items ${isActive ? "active" : ""}`
                  }
                >
                  <img src="/images/My Reports Icon.svg" className="nav-icon" alt='Reports' width="20px"
                    height="20px" />
                  <p className="nav-text">My Tasks</p>
                </NavLink>
              ) : (
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `nav-items ${isActive ? "active" : ""}`
                  }
                >
                  <img src="/images/My Reports Icon.svg" className="nav-icon" alt='Reports' width="20px"
                    height="20px" />
                  <p className="nav-text">My Reports</p>
                </NavLink>
              )}
              {/* Show History only for admin */}
              {user?.role === 'admin' && (
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `nav-items ${isActive ? "active" : ""}`
                  }
                >
                  <img src="/images/Timemachine.svg" className="nav-icon" alt='Dashboard' width="20px"
                    height="20px" />
                  <p className="nav-text">History</p>
                </NavLink>
              )}
              <NavLink
                to={user?.role === 'admin' ? "/admin/profile" : "/profile"}
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Account Icon.svg" className="nav-icon" alt='Profile' width="20px"
                  height="20px" />
                <p className="nav-text">Profile</p>
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Notification Icon.svg" className="nav-icon" alt='Dashboard' width="20px"
                  height="20px" />
                <p className="nav-text">Notifications</p>
              </NavLink>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Chat Icon.svg" className="nav-icon" alt='Chat' width="20px"
                  height="20px" />
                <p className="nav-text">Chat</p>
              </NavLink>
              <div className="nav-items" onClick={handleLogout}>
                <img src="/images/Log Out Icon.svg" className="nav-icon" alt='Logout' width="20px"
                  height="20px" />
                <p className="nav-text">Logout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className={modalClasses} onClick={closeModal}>
          <div className="modal-content " onClick={(e) => e.stopPropagation()}>
            <div className="nav-container ">
              <div className="nav-title">
                <img src="/images/Logo.png" alt="RP Campus Care Logo" className="nav-logo" />
                <p className="nav-text-title">Campus Care</p>
              </div>
               {user?.role === 'admin' ? (
              <div className="nav-create" onClick={() => navigate('/announcement-form')}>
                  <img src="/images/Plus.svg" alt="Create Icon" className="nav-icon" style={{ height: 20, width: 20 }} />
                  <p className="nav-text">Announce</p>
                </div>
              ) : (
                <div className="nav-create" onClick={() => navigate('/reports/new')}>
                <img src="/images/Plus.svg" alt="Create Icon" className="nav-icon" style={{ height: 20, width: 20 }} />
                <p className="nav-text">Create</p>
              </div>
              )}
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Dashboard Icon.svg" className="nav-icon" alt='Dashboard' width="20px"
                  height="20px" />
                <p className="nav-text">Dashboard</p>
              </NavLink>
              {/* Show My Tasks for admin, My Reports for student/staff */}
              {user?.role === 'admin' ? (
                <NavLink
                  to="/mytasks"
                  className={({ isActive }) =>
                    `nav-items ${isActive ? "active" : ""}`
                  }
                >
                  <img src="/images/My Reports Icon.svg" className="nav-icon" alt='Reports' width="20px"
                    height="20px" />
                  <p className="nav-text">My Tasks</p>
                </NavLink>
              ) : (
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `nav-items ${isActive ? "active" : ""}`
                  }
                >
                  <img src="/images/My Reports Icon.svg" className="nav-icon" alt='Reports' width="20px"
                    height="20px" />
                  <p className="nav-text">My Reports</p>
                </NavLink>
              )}
              {/* Show History only for admin */}
              {user?.role === 'admin' && (
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `nav-items ${isActive ? "active" : ""}`
                  }
                >
                  <img src="/images/Timemachine.svg" className="nav-icon" alt='Dashboard' width="20px"
                    height="20px" />
                  <p className="nav-text">History</p>
                </NavLink>
              )}
              <NavLink
                to={user?.role === 'admin' ? "/admin/profile" : "/profile"}
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Account Icon.svg" className="nav-icon" alt='Profile' width="20px"
                  height="20px" />
                <p className="nav-text">Profile</p>
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Notification Icon.svg" className="nav-icon" alt='Dashboard' width="20px"
                  height="20px" />
                <p className="nav-text">Notifications</p>
              </NavLink>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `nav-items ${isActive ? "active" : ""}`
                }
              >
                <img src="/images/Chat Icon.svg" className="nav-icon" alt='Chat' width="20px"
                  height="20px" />
                <p className="nav-text">Chat</p>
              </NavLink>
              <div className="nav-items" onClick={handleLogout}>
                <img src="/images/Log Out Icon.svg" className="nav-icon" alt='Logout' width="20px"
                  height="20px" />
                <p className="nav-text">Logout</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
