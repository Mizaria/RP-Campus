import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/indiReport.css';
import backgroundImage from '../assets/images/mainBackground.svg';


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
                    <p style={{ paddingTop: 4 }}>#1203</p>
                </div>
                <div class="main-right">
                    <li>
                        <img src="/images/more vertical.svg" alt="Menu Icon" class="menu-icon" width="22px"
                            height="22px" />
                        <ul class="dropdown">
                            <li><a><img src="/images/edit.svg" alt="Edit Icon" class="dropdown-icon" width="22px"
                                height="22px" />Edit</a></li>
                            <li><a><img src="/images/delete.svg" alt="Delete Icon" class="dropdown-icon" width="22px"
                                height="22px" />Delete</a></li>
                        </ul>
                    </li>
                </div>
            </div>
        </div>
    );
};
const IndiReport = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
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


    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav />
            
        </div>
    );
};


export default IndiReport;