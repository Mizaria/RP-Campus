import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useIndividualReport from '../hooks/useIndividualReport';
import '../assets/styles/indiReport.css';
import backgroundImage from '../assets/images/mainBackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = ({ report, onEdit, onDelete }) => {
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
                    <h2>Report</h2>
                    <p style={{ paddingTop: 4 }}>{report ? `#${report._id.toString().slice(-4)}` : '#----'}</p>
                </div>
                {report && report.status === 'Pending' && (
                    <div className="main-right">
                        <li>
                            <img src="/images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px"
                                height="22px" />
                            <ul className="dropdown">
                                <li onClick={() => onEdit && onEdit(report)}>
                                    <img src="/images/edit.svg" alt="Edit Icon" className="dropdown-icon" width="22px"
                                        height="22px" />Edit
                                </li>
                                <li onClick={() => onDelete && onDelete(report)}>
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
const IndiReport = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const navigate = useNavigate();
    const { id } = useParams();

    // Use the custom hook to fetch report data
    const {
        report,
        loading,
        error,
        deleteReport,
        formatDate,
        getStatusColor,
        getCategoryIcon,
        getReportIdDisplay
    } = useIndividualReport(id);

    // Handle edit report
    const handleEditReport = (report) => {
        navigate(`/reports/${report._id}/edit`);
    };

    // Handle delete report
    const handleDeleteReport = async (report) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            const result = await deleteReport();
            if (result.success) {
                console.log('Report deleted successfully');
                navigate('/my-reports'); // Navigate back to reports list
            } else {
                alert('Failed to delete report: ' + result.error);
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
            <SecNav report={report} onEdit={handleEditReport} onDelete={handleDeleteReport} />
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
                            {report.status === 'Resolved' && (
                                <div className="report-info">
                                    <p>Resolved In:</p>
                                    <div>{formatDate(report.updatedAt)}</div>
                                </div>
                            )}
                            <div className="report-info">
                                <p>Status:</p>
                                <div className="status-info">
                                    <div className="staus-circle-s" style={{ backgroundColor: getStatusColor(report.status) }} />
                                    {report.status}
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
                            <div className="assigned-to">
                                Assigned to: {
                                    report.assignedTo && report.assignedTo.username
                                        ? report.assignedTo.username
                                        : '???'
                                }
                            </div>
                        </div>
                        {report.status === 'Resolved' && (
                            <>
                                <h2 className="page-title" style={{ width: "100%" }}>Additional Information</h2>
                                <div className="additional-information">
                                    <div className="remark">
                                        <div className="report-info-des">
                                            <p>Remark:</p>
                                            <div className="des-textbox">
                                                {report.comments && report.comments.length > 0
                                                    ? report.comments[report.comments.length - 1].commentText
                                                    : 'No remarks'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="additional-img">
                                        {report.comments && report.comments.length > 0 && report.comments[report.comments.length - 1].photoUrl ? (
                                           
                                                <img
                                                    src={`${API_BASE_URL}${report.comments[report.comments.length - 1].photoUrl}`}
                                                    alt="Additional"
                                                    className="report-image"
                                                    style={{ height: "100%" }}
                                                    onError={(e) => {
                                                        console.log('Additional image load error, URL:', e.target.src);
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.style.display = 'none';
                                                        e.target.parentElement.nextElementSibling.style.display = 'block';
                                                    }}
                                                />
                                            
                                        ) : null}
                                        {(!report.comments || report.comments.length === 0 || !report.comments[report.comments.length - 1].photoUrl) && (
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
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="spacer" />
                    </div>
                )}
            </div>
        </div>
    );
};


export default IndiReport;
