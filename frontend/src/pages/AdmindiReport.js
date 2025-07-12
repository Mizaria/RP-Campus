import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from '../components/common/Toast';
import useAdminIndividualReport from '../hooks/useAdminIndividualReport';
import useToast from '../hooks/useToast';
import '../assets/styles/AdminindiReport.css';
import backgroundImage from '../assets/images/adminmainbackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ 
    report, 
    shouldShowDropdown, 
    setShouldShowDropdown, 
    handleEscalateClick, 
    handleDeEscalateClick, 
    handleDeleteClick 
}) => {
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

    const toggleDropdown = () => {
        setShouldShowDropdown(!shouldShowDropdown);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.main-right')) {
                setShouldShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [setShouldShowDropdown]);
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
                    <h2>Report Details</h2>
                    <p style={{ paddingTop: 4 }}>{report ? `#${report._id.toString().slice(-4)}` : '#----'}</p>
                </div>
                {report && (
                    <div className="main-right" onClick={(e) => e.stopPropagation()}>
                        <li>
                            <img 
                                src="/images/more vertical.svg" 
                                alt="Menu Icon" 
                                className="menu-icon" 
                                width="22px"
                                height="22px" 
                                onClick={toggleDropdown}
                                style={{ cursor: 'pointer' }}
                            />
                           
                                <ul className="dropdown">
                                    {report.priority !== 'High' && (
                                        <li onClick={handleEscalateClick}>
                                            <img src="/images/Up.svg" alt="Escalate Icon" className="dropdown-icon" width="22px"
                                                height="22px" />Escalate 
                                        </li>
                                    )}
                                    {report.priority !== 'Low' && (
                                        <li onClick={handleDeEscalateClick}>
                                            <img src="/images/Down.svg" alt="De-escalate Icon" className="dropdown-icon" width="22px"
                                                height="22px" />De-escalate 
                                        </li>
                                    )}
                                    <li onClick={handleDeleteClick}>
                                        <img src="/images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px"
                                            height="22px" />Delete 
                                    </li>
                                </ul>
                           
                        </li>
                    </div>
                )}
            </div>
        </div>
    );
};
const AdminIndiReport = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [shouldShowDropdown, setShouldShowDropdown] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    // Use the custom hook to fetch report data
    const {
        report,
        loading,
        error,
        acceptReport,
        escalateReport,
        deEscalateReport,
        deleteReport,
        canEscalate,
        canDeEscalate,
        formatDate,
        getStatusColor,
        getPriorityColor,
        getCategoryIcon,
        getReportIdDisplay
    } = useAdminIndividualReport(id);

    // Use toast notifications
    const { toasts, removeToast, showSuccess, showError } = useToast();

    // Handle accept report
    const handleAcceptReport = async () => {
        if (window.confirm('Are you sure you want to accept this report? This will assign it to you as a task.')) {
            const result = await acceptReport();
            if (result.success) {
                showSuccess(result.message);
                // Navigate back to dashboard after accepting
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                showError('Failed to accept report: ' + result.error);
            }
        }
    };

    // Handle escalate report
    const handleEscalateClick = async () => {
        if (window.confirm('Are you sure you want to escalate this report to High priority?')) {
            const result = await escalateReport();
            if (result.success) {
                showSuccess(result.message);
                setShouldShowDropdown(false);
            } else {
                showError('Failed to escalate report: ' + result.error);
            }
        }
    };

    // Handle de-escalate report
    const handleDeEscalateClick = async () => {
        if (window.confirm('Are you sure you want to de-escalate this report to Low priority?')) {
            const result = await deEscalateReport();
            if (result.success) {
                showSuccess(result.message);
                setShouldShowDropdown(false);
            } else {
                showError('Failed to de-escalate report: ' + result.error);
            }
        }
    };

    // Handle delete report
    const handleDeleteClick = async () => {
        if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            const result = await deleteReport();
            if (result.success) {
                showSuccess(result.message);
                // Navigate back to dashboard after deleting
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
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

    // Get building background color
    const getBuildingColor = (building) => {
        if (!building) return '#E0E0E0';

        const buildingCode = building.toUpperCase();

        switch (buildingCode) {
            case 'E4':
            case 'E5':
                return '#E0F1EB';
            case 'W2':
            case 'W1':
                return '#E6F3F5';
            case 'W3':
            case 'W5':
                return '#F5E6F1';
            case 'E2':
                return '#EFE7F2';
            case 'E1':
                return '#EAF3DE';
            case 'E6':
                return '#F1EFCD';
            case 'W4':
                return '#EAE5CB';
            case 'W6':
                return '#EAE0D8';
            default:
                return '#E0E0E0';
        }
    };

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav 
                report={report} 
                shouldShowDropdown={shouldShowDropdown}
                setShouldShowDropdown={setShouldShowDropdown}
                handleEscalateClick={handleEscalateClick}
                handleDeEscalateClick={handleDeEscalateClick}
                handleDeleteClick={handleDeleteClick}
            />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="dashboard-content">
                {loading ? (
                    <div className="loading-message">
                        <p>Loading report details...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <p>Error loading report: {error}</p>
                        <button onClick={() => navigate(-1)} className="retry-button">
                            Go Back
                        </button>
                    </div>
                ) : !report ? (
                    <div className="no-report-message">
                        <p>Report not found.</p>
                        <button onClick={() => navigate(-1)} className="retry-button">
                            Go Back
                        </button>
                    </div>
                ) : (
                    <div className="report-info-container">
                        <div className="report-left-indi">
                            <div className="report-info-title">
                                <p>Report Information</p>
                                <img
                                    src={getCategoryIcon(report.category)}
                                    alt="Report Icon"
                                    className="report-type-icon"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            <div className="report-info">
                                <p>Location:</p>
                                <div className="report-location-s" style={{ backgroundColor: getBuildingColor(report.building) }}>
                                    {report.building}, {report.location}, {report.room}
                                </div>
                            </div>
                            <div className="report-info">
                                <p>Category:</p>
                                <div>{report.category} Problem</div>
                            </div>
                            <div className="report-info">
                                <p>Created At:</p>
                                <div>{formatDate(report.createdAt)}</div>
                            </div>
                            <div className="report-info">
                                <p>Priority:</p>
                                <div className="status-info">
                                    <div className="staus-circle-s" style={{ backgroundColor: getPriorityColor(report.priority) }} />
                                    {report.priority}
                                </div>
                            </div>
                            <div className="report-info-des">
                                <p>Description:</p>
                                <div className="des-textbox">{report.description}</div>
                            </div>
                        </div>
                        <div className="report-right">
                            {report.photoUrl ? (
                                <div className="report-image-container">
                                    <img
                                        src={`${API_BASE_URL}${report.photoUrl}`}
                                        alt="Report"
                                        className="report-image"
                                        style={{ height: "100%" }}
                                        onError={(e) => {
                                            console.log('Main image load error, URL:', e.target.src);
                                            e.target.style.display = 'none';
                                            e.target.parentElement.style.display = 'none';
                                            e.target.parentElement.nextElementSibling.style.display = 'block';
                                        }}
                                    />
                                </div>
                            ) : null}
                            {!report.photoUrl && (
                                <div className="report-image-container">
                                    <div className="no-img">
                                        <img
                                            src="/images/noimg 1.svg"
                                            alt="No Image"
                                            className="no-image-icon"
                                            width={120}
                                            height={120}
                                        />
                                        <p>No Image Added</p>
                                    </div>
                                </div>
                            )}
                            {report.status === 'Pending' && (
                                <div className="accept-btn-indi">
                                    <button 
                                        className="accept-report-btn-indi"
                                        onClick={handleAcceptReport}
                                    >
                                        Accept
                                    </button>
                                </div>
                            )}
                            {report.status !== 'Pending' && (
                                <div className="assigned-to">
                                    Report Status: {report.status}
                                    {report.assignedTo && (
                                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                            Assigned to: {report.assignedTo.username || 'Unknown'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="spacer" />
                    </div>
                )}
            </div>
        </div>
    );
};


export default AdminIndiReport;

