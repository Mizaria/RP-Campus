import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TaskCardAdmin } from '../components/reports/AdminTaskCard';
import { ToastContainer } from '../components/common/Toast';
import useAdminTasks from '../hooks/useAdminTasks';
import useToast from '../hooks/useToast';
import '../assets/styles/History.css';
import backgroundImage from '../assets/images/adminmainbackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ currentSort, handleSortChange }) => {
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
          <input type="text" placeholder="Search report..." />
        </div>
        <div className="bar-item">
          <img src="images/Notification Icon.svg" alt="Notification Icon" width="20px" height="20px" />
          <img src="images/Green Circle.svg" alt="Notification Indicator" className="notification-circle" />
        </div>
      </div>
      <div className="main-content">
        <div className="Page-header">
          <h2>History</h2>
          <div className="main-right">
            <li>
              <img src="images/Descending Sorting.svg" alt="Arrow Icon" width="20px" height="20px" />
              <ul className="dropdown">
                <li onClick={() => handleSortChange('All')}>
                  <a>All{currentSort === 'All' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Status')}>
                  <a>Status{currentSort === 'Status' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Priority')}>
                  <a>Priority{currentSort === 'Priority' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Category')}>
                  <a>Category{currentSort === 'Category' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
                <li onClick={() => handleSortChange('Created')}>
                  <a>Created{currentSort === 'Created' && <img src="images/Done.svg" alt="Done Icon" className="dropdown-icon" width="22px" height="22px" />}</a>
                </li>
              </ul>
            </li>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminHistory = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [currentSort, setCurrentSort] = useState('All');
  const navigate = useNavigate();
  
  // Use the admin tasks hook to fetch tasks
  const { 
    tasks, 
    loading, 
    error, 
    getTasksByStatus, 
    getTaskCounts,
    completeTask,
    removeTask
  } = useAdminTasks();

  // Use toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // Get only draft and completed tasks
  const draftTasks = getTasksByStatus('Draft');
  const completedTasks = getTasksByStatus('Completed');
  const allHistoryTasks = [...draftTasks, ...completedTasks];
  
  // Get task counts for the status tabs
  const taskCounts = getTaskCounts();

  // Sort tasks based on current sort option
  const getSortedTasks = () => {
    let sortedTasks = [...allHistoryTasks];
    
    switch (currentSort) {
      case 'Status':
        sortedTasks.sort((a, b) => {
          const statusOrder = { 'Draft': 0, 'Completed': 1 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
      case 'Priority':
        sortedTasks.sort((a, b) => {
          const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        break;
      case 'Category':
        sortedTasks.sort((a, b) => {
          const categoryA = a.reportId?.category || '';
          const categoryB = b.reportId?.category || '';
          return categoryA.localeCompare(categoryB);
        });
        break;
      case 'Created':
        sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'All':
      default:
        // Default sorting by status (Draft -> Completed)
        sortedTasks.sort((a, b) => {
          const statusOrder = { 'Draft': 0, 'Completed': 1 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
    }
    
    return sortedTasks;
  };

  // Handle sort option selection
  const handleSortChange = (sortOption) => {
    setCurrentSort(sortOption);
  };

  // Handle task click to view details
  const handleTaskClick = (task) => {
    if (task._id) {
      navigate(`/task/${task._id}`);
    }
  };

  // Handle complete task (mark as completed and resolve report)
  const handleCompleteTask = async (task) => {
    console.log('Complete task called for task:', task._id, 'status:', task.status);
    
    if (window.confirm('Are you sure you want to mark this task as completed? This will resolve the report.')) {
      console.log('User confirmed completion, calling completeTask...');
      const result = await completeTask(task._id);
      console.log('Complete task result:', result);
      
      if (result.success) {
        showSuccess(result.message);
      } else {
        showError('Failed to complete task: ' + result.error);
      }
    }
  };

  // Handle remove task with enhanced deletion of comments and images
  const handleRemoveTask = async (task) => {
    if (window.confirm('Are you sure you want to remove this task? This will delete all associated comments, images, and unassign the report making it available for other admins.')) {
      try {
        // First, clear comments from the report using the new endpoint
        if (task.reportId && task.reportId._id) {
          try {
            console.log(`Attempting to clear comments for report ID: ${task.reportId._id}`);
            const clearCommentsResponse = await fetch(`${API_BASE_URL}/api/reports/${task.reportId._id}/comments`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (clearCommentsResponse.ok) {
              const result = await clearCommentsResponse.json();
              console.log('Comments cleared successfully:', result);
            } else {
              const errorText = await clearCommentsResponse.text();
              console.error('Failed to clear comments:', clearCommentsResponse.status, errorText);
              showError(`Failed to clear comments: ${clearCommentsResponse.status}`);
            }
          } catch (commentError) {
            console.error('Error clearing comments:', commentError);
            showError('Error clearing comments: ' + commentError.message);
            // Continue with task removal even if comment clearing fails
          }
        }

        // Then remove the task
        const result = await removeTask(task._id);
        if (result.success) {
          showSuccess('Task, comments, and images removed successfully!');
        } else {
          showError('Failed to remove task: ' + result.error);
        }
      } catch (error) {
        console.error('Error in handleRemoveTask:', error);
        showError('Failed to remove task and associated data');
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
      <SecNav currentSort={currentSort} handleSortChange={handleSortChange} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div class="dashboard-content">

        <h2 class="page-title"></h2>
        <div class="report-horizontal-my">
          <div class="status-tab">
            <div class="draft">
              <p>Draft</p>
              <div class="tab-count">
                <p>{taskCounts.draft}</p>
              </div>
            </div>
            <div class="completed">
              <p>Completed</p>
              <div class="tab-count">
                <p>{taskCounts.completed}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="report-vertical">
          {loading ? (
            <div className="loading-message">
              <p>Loading your task history...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>Error loading tasks: {error}</p>
            </div>
          ) : allHistoryTasks.length === 0 ? (
            <div className="no-reports-message">
              <p>No completed or draft tasks found.</p>
            </div>
          ) : (
            getSortedTasks().map((task) => (
              <TaskCardAdmin
                key={task._id}
                task={task}
                onTaskClick={handleTaskClick}
                onRemoveTask={handleRemoveTask}
                onCompleteTask={handleCompleteTask}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHistory;
