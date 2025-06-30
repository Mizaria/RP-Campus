import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './SignupProfileImg.css';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/images/background.png';

const SignupProfileImg = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('/images/Frame 47.svg');
    const [loading, setLoading] = useState(false);
    const [signupData, setSignupData] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Check if user came from signup page
    useEffect(() => {
        const storedSignupData = sessionStorage.getItem('signupData');
        if (!storedSignupData) {
            // If no signup data, redirect to signup page
            navigate('/signup');
            return;
        }
        setSignupData(JSON.parse(storedSignupData));
    }, [navigate]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                alert('Please select an image smaller than 5MB.');
                return;
            }

            setSelectedImage(file);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleSignupClick = () => {
        navigate('/signup');
    };

    const handleSkipClick = async () => {
        // Complete signup without profile image
        await completeSignup(null);
    };

    const handleDoneClick = async () => {
        // Complete signup with profile image
        await completeSignup(selectedImage);
    };

    const completeSignup = async (imageFile) => {
        if (!signupData) return;
        
        console.log('Starting completeSignup with:', { signupData, hasImage: !!imageFile });
        
        setLoading(true);
        try {
            const formData = new FormData();
            const storedToken = sessionStorage.getItem('signupToken');
            
            console.log('Stored signup data:', signupData);
            console.log('Stored token:', storedToken ? 'present' : 'missing');
            
            formData.append('userId', signupData.id);
            formData.append('token', storedToken);
            
            if (imageFile) {
                formData.append('profileImage', imageFile);
                console.log('Appending image file:', imageFile.name);
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/auth/complete-signup`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Response status:', response.status);
            console.log('Response data:', data);
            console.log('User data from response:', data.user);

            if (response.ok) {
                console.log('About to login with user data:', data.user);
                // Login the user and navigate to dashboard
                login(data.user, data.token);
                
                // Clear session storage
                sessionStorage.removeItem('signupData');
                sessionStorage.removeItem('signupToken');
                
                navigate('/dashboard');
            } else {
                console.error('Signup completion failed:', data);
                alert(data.message || 'Failed to complete signup');
            }
        } catch (error) {
            console.error('Complete signup error:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-profile-img-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <nav className="top-nav">
                <div className="nav-buttons">
                    <button className="login-btn" onClick={handleLoginClick}>
                        Login
                    </button>
                    <button className="signup-btn" onClick={handleSignupClick}>
                        Sign Up
                    </button>
                </div>
            </nav>

            <main className="main-container">
                <div className="logo-container">
                    <img src={Logo} alt="RP Campus Care Logo" className="logo" />
                    <h1 className="title">RP Campus Care</h1>
                </div>
                
                <div className="profile-container">
                    <h2 className="section-title">Create your profile picture</h2>
                    
                    <div className="profile-picture-holder">
                        <img 
                            src={imagePreview} 
                            alt="Profile Picture Placeholder" 
                            className={`profile-placeholder ${selectedImage ? 'has-image' : ''}`}
                            id="profilePreview"
                        />
                        <label htmlFor="profileImageInput" className="add-photo-btn">
                            <img src="/images/Plus.svg" alt="Add Photo" className="plus-icon" />
                            <input 
                                type="file" 
                                id="profileImageInput" 
                                accept="image/*" 
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                    
                    <div className="button-container">
                        <button 
                            className="skip-button" 
                            onClick={handleSkipClick}
                            disabled={loading}
                        >
                            {loading && !selectedImage ? 'Processing...' : 'Skip'}
                        </button>
                        {selectedImage && (
                            <button 
                                className="skip-button"
                                onClick={handleDoneClick}
                                disabled={loading}
                            >
                                {loading && selectedImage ? 'Uploading...' : 'Done'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SignupProfileImg;
