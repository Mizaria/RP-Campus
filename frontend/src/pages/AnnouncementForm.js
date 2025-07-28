import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnnouncements } from '../hooks/useAnnouncements';
import NotificationIcon from '../components/NotificationIcon';
import '../assets/styles/Announcement.css';


// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SecNav = () => {
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
        <div className="mainBackground" style={{ backgroundImage: `url(${user?.role === 'admin' ? '/images/adminmainbackground.svg' : '/images/mainBackground.svg'})` }}>
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
                <NotificationIcon onClick={() => navigate('/notifications')} />
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>Create Announcement</h2>
                </div>
            </div>
        </div>
    );
};
const AnnouncementForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createAnnouncement, loading, error } = useAnnouncements();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Check if user is admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            console.warn('Non-admin user attempted to access announcement form');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Debug logging
    useEffect(() => {
        console.log('AnnouncementForm - Current user:', user);
        console.log('AnnouncementForm - Form data:', formData);
    }, [user, formData]);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (formError) setFormError('');
        if (successMessage) setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        // Validate form
        if (!formData.title || !formData.title.trim()) {
            setFormError('Title is required');
            return;
        }
        
        if (!formData.description || !formData.description.trim()) {
            setFormError('Description is required');
            return;
        }

        if (formData.title.trim().length > 200) {
            setFormError('Title cannot exceed 200 characters');
            return;
        }

        if (formData.description.trim().length > 2000) {
            setFormError('Description cannot exceed 2000 characters');
            return;
        }

        try {
            const result = await createAnnouncement({
                title: formData.title.trim(),
                description: formData.description.trim()
            });

            if (result.success) {
                setSuccessMessage('Announcement created successfully!');
                setFormData({ title: '', description: '' });
                
                // Redirect to admin dashboard after successful creation
                navigate('/dashboard');
            } else {
                setFormError(result.error || 'Failed to create announcement');
            }
        } catch (err) {
            console.error('Error creating announcement:', err);
            setFormError('An unexpected error occurred');
        }
    };


    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav />
            <div className="dashboard-content">
                <div className="announcement-form-container">
                    <p>Announcement details</p>
                    
                    {/* Display error message only */}
                    {(formError || error) && (
                        <div className="error-message">
                            {formError || error}
                        </div>
                    )}

                    <form className='announcement-form' onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            id="announce-title" 
                            name="title" 
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder='Enter announcement title...' 
                            maxLength={200}
                            required 
                            disabled={loading}
                        />

                        <textarea 
                            id="announce-description" 
                            name="description" 
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder='Enter announcement description...' 
                            maxLength={2000}
                            rows={6}
                            required
                            disabled={loading}
                        ></textarea>

                        <button 
                            type="submit" 
                            className='create-announcement-btn'
                        >
                            {loading ? 'Announcing...' : 'Announce'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export default AnnouncementForm;