import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnnouncements } from '../hooks/useAnnouncements';
import NotificationIcon from '../components/NotificationIcon';
import '../assets/styles/Announcement.css';
import backgroundImage from '../assets/images/mainBackground.svg';
import adminbackgroundImage from '../assets/images/adminmainbackground.svg';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);

    useEffect(() => {
        console.log('Announcements user data:', user);
        console.log('API_BASE_URL:', API_BASE_URL);
        if (user?.profileImage) {
            console.log('Constructed image URL:', `${API_BASE_URL}/uploads/${user.profileImage}`);
        }
    }, [user]);

    const toggleNavbar = () => {
        setIsNavbarVisible(!isNavbarVisible);
        window.dispatchEvent(new CustomEvent('toggleNavbar', {
            detail: { isVisible: !isNavbarVisible }
        }));
    };

    const toggleModel = () => {
        window.dispatchEvent(new CustomEvent('toggleModal', {
            detail: { isOpen: true }
        }));
    };

    return (
        <div className="mainBackground" style={{ backgroundImage: `url(${user?.role === 'admin' ? adminbackgroundImage : backgroundImage})` }}>
            <div className="nav-bar">
                <div className="bar-item-menu" onClick={toggleNavbar}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-item-modal" onClick={toggleModel}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-search">
                    <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
                    <input type="text" placeholder="Search announcements..." />
                </div>
                <NotificationIcon onClick={() => navigate('/notifications')} />
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>My Announcements</h2>
                    <button 
                        className="create-announcement-btn"
                        onClick={() => navigate('/admin/announcement-form')}
                        style={{ marginLeft: 'auto' }}
                    >
                        Create New
                    </button>
                </div>
            </div>
        </div>
    );
};

const AnnouncementsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { getMyAnnouncements, deleteAnnouncement, loading, error } = useAnnouncements();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [pagination, setPagination] = useState({});

    // Check if user is admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Listen for navbar toggle events
    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    // Fetch announcements
    useEffect(() => {
        const fetchAnnouncements = async () => {
            const result = await getMyAnnouncements(1, 10);
            if (result.success) {
                setAnnouncements(result.data.announcements);
                setPagination(result.data.pagination);
            }
        };

        if (user?.role === 'admin') {
            fetchAnnouncements();
        }
    }, [user, getMyAnnouncements]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            const result = await deleteAnnouncement(id);
            if (result.success) {
                setAnnouncements(prev => prev.filter(ann => ann._id !== id));
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isExpired = (expiresAt) => {
        return new Date(expiresAt) < new Date();
    };

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav />
            <div className="dashboard-content">
                <div className="announcement-form-container">
                    {error && (
                        <div className="error-message" style={{
                            color: '#dc3545',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px',
                            padding: '12px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            Loading announcements...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            <p>No announcements found.</p>
                            <button 
                                className="create-announcement-btn"
                                onClick={() => navigate('/admin/announcement-form')}
                            >
                                Create Your First Announcement
                            </button>
                        </div>
                    ) : (
                        <div className="announcements-list">
                            {announcements.map((announcement) => (
                                <div 
                                    key={announcement._id} 
                                    className="announcement-card"
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '16px',
                                        backgroundColor: isExpired(announcement.expiresAt) ? '#f8f9fa' : 'white'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ 
                                                margin: '0 0 8px 0', 
                                                color: isExpired(announcement.expiresAt) ? '#666' : '#333'
                                            }}>
                                                {announcement.title}
                                                {isExpired(announcement.expiresAt) && (
                                                    <span style={{ 
                                                        marginLeft: '8px', 
                                                        color: '#dc3545', 
                                                        fontSize: '12px',
                                                        fontWeight: 'normal'
                                                    }}>
                                                        (EXPIRED)
                                                    </span>
                                                )}
                                            </h3>
                                            <p style={{ 
                                                margin: '0 0 12px 0', 
                                                color: isExpired(announcement.expiresAt) ? '#666' : '#555',
                                                lineHeight: '1.5'
                                            }}>
                                                {announcement.description}
                                            </p>
                                            <small style={{ color: '#888' }}>
                                                Created: {formatDate(announcement.createdAt)} | 
                                                Expires: {formatDate(announcement.expiresAt)}
                                            </small>
                                        </div>
                                        <div style={{ marginLeft: '16px' }}>
                                            <button
                                                onClick={() => handleDelete(announcement._id)}
                                                style={{
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsList;
