import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/images/background.png';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { handleSignup, loading, error, success, clearError } = useSignup();  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student' // Default role 
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError(); // Clear any previous errors
    
    // Prepare data in the format expected by useSignup hook
    const signupData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };
    
    const result = await handleSignup(signupData);
    if (result.success) {
      // Store signup data temporarily for profile image step
      sessionStorage.setItem('signupData', JSON.stringify(result.userData));
      // Navigate to profile image setup instead of dashboard
      navigate('/signup-profile');
    } else {
      // Error handling is done by the hook
      console.log('Signup failed:', result.error);
    }
  };

  return (
    <div className="signup-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <nav className="top-nav">
        <div className="nav-buttons">
          <button className="login-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
      </nav>
      <main className="main-container">
        <div className="logo-container">
          <img src={Logo} alt="RP Campus Care Logo" className="logo" />
          <h1 className="title">RP Campus Care</h1>
        </div>        <form className="form-container" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              Registration successful! Redirecting to dashboard...
            </div>
          )}          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" placeholder="Enter your username..." value={formData.username} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email..." value={formData.email} onChange={handleChange} required />
          </div>          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password..." value={formData.password} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="role">Role</label>
            <select id="role" className="custom-select" value={formData.role} onChange={handleChange}>
              <option value="student">Admin</option>
             
            
            </select>
          </div>
          <button type="submit" className="login-button" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
      </main>
    </div>
  );
};

export default Signup;
