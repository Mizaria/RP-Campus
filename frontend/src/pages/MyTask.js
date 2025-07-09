import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TaskCardAdmin } from '../components/reports/AdminTaskCard';
import { ToastContainer } from '../components/common/Toast';
import useAdminTasks from '../hooks/useAdminTasks';
import useToast from '../hooks/useToast';
import '../assets/styles/MyTask.css';
import backgroundImage from '../assets/images/adminmainbackground.svg';

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
                <div className="bar-item">
                    <img src="images/Notification Icon.svg" alt="Notification Icon" width="20px" height="20px" />
                    <img src="images/Green Circle.svg" alt="Notification Indicator" className="notification-circle" />
                </div>
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>My Task</h2>
                </div>
            </div>
        </div>
    );
};

const MyTasks = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Use admin tasks hook to fetch tasks assigned to current admin
    const {
        tasks,
        loading,
        error,
        getTasksByStatus,
        getTaskCounts,
        removeTask,
        progressTask,
        completeTask,
        refreshTasks
    } = useAdminTasks();

    // Use toast notifications
    const { toasts, removeToast, showSuccess, showError } = useToast();

    // Filter tasks based on search term
    const filterTasks = (tasks) => {
        if (!searchTerm.trim()) return tasks;

        return tasks.filter(task => {
            const report = task.reportId || {};
            return (
                (report.category && report.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.building && report.building.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.location && report.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.room && report.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (task._id && task._id.toString().includes(searchTerm))
            );
        });
    };

    // Get filtered task data by status
    const toDoTasks = filterTasks(getTasksByStatus('To Do'));
    const inProgressTasks = filterTasks(getTasksByStatus('In Progress'));
    const draftTasks = filterTasks(getTasksByStatus('Draft'));
    const taskCounts = getTaskCounts();

    // Handle task click to view details
    const handleTaskClick = (task) => {
        navigate(`/task/${task._id}`);
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

    // Handle progress task to next status
    const handleProgressTask = async (task) => {
        const result = await progressTask(task._id, task.status);
        if (result.success) {
            showSuccess(`Task progressed to ${result.data.status}`);
        } else {
            showError('Failed to progress task: ' + result.error);
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
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="dashboard-content" style={{ paddingRight: '20px' }}>
                {loading ? (
                    <div className="loading-message">Loading tasks...</div>
                ) : error ? (
                    <div className="error-message">Error: {error}</div>
                ) : (
                    <div className="report-horizontal">
                        {/* To Do Tasks */}
                        <div className="task-container">
                            <div className="dashboard-top-container">
                                <div>
                                    <div className="status-tab">
                                        <div className="to-do">
                                            <p>To Do</p>
                                            <div className="tab-count">
                                                <p>{taskCounts.toDo}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="report-vertical">
                                {toDoTasks.length === 0 ? (
                                    <div className="no-reports-message">No tasks to do</div>
                                ) : (
                                    toDoTasks.map((task) => (
                                        < TaskCardAdmin
                                            key={task._id}
                                            task={task}
                                            onTaskClick={handleTaskClick}
                                            onRemoveTask={handleRemoveTask}
                                            onProgressTask={handleProgressTask}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* In Progress Tasks */}
                        <div className="task-container" >
                            <div className="dashboard-top-container">
                                <div>
                                    <div className="status-tab">
                                        <div className="progress">
                                            <p>In Progress</p>
                                            <div className="tab-count">
                                                <p>{taskCounts.inProgress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="report-vertical">
                                {inProgressTasks.length === 0 ? (
                                    <div className="no-reports-message">No tasks in progress</div>
                                ) : (
                                    inProgressTasks.map((task) => (
                                        <TaskCardAdmin
                                            key={task._id}
                                            task={task}
                                            onTaskClick={handleTaskClick}
                                            onRemoveTask={handleRemoveTask}
                                            onProgressTask={handleProgressTask}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Draft Tasks */}
                        <div className="task-container" >
                            <div className="dashboard-top-container">
                                <div>
                                    <div className="status-tab">
                                        <div className="completed">
                                            <p>Draft</p>
                                            <div className="tab-count">
                                                <p>{taskCounts.draft}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="report-vertical">
                                {draftTasks.length === 0 ? (
                                    <div className="no-reports-message">No draft tasks</div>
                                ) : (
                                    draftTasks.map((task) => (
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
                )}
            </div>
        </div>
    );
};

export default MyTasks;
