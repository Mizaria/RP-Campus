import React, { useState } from 'react';
import { useSignup } from '../hooks/useSignup';
import { Link } from 'react-router-dom';
import './Signup.css';
import backgroundImage from '../assets/images/background.png';
import logoImage from '../assets/images/Logo.png';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNo: ''
  });
  
  const { handleSignup, loading, error, success } = useSignup();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const signupData = {
      username: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      phone: formData.phoneNo,
      role: 'student'
    };
    handleSignup(signupData);
  };

  return (
    <div className="signup-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <nav className="top-nav">
        <div className="nav-buttons">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/signup" className="signup-btn">Sign Up</Link>
        </div>
      </nav>

      <main className="main-container">
        <div className="logo-container">
          <img src={logoImage} alt="RP Campus Care Logo" className="logo" />
          <h1 className="title">RP Campus Care</h1>
        </div>

        <div className="form-container">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Account created successfully!</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name..."
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name..."
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email..."
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password..."
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="phoneNo">Phone No.</label>
              <input 
                type="tel" 
                id="phoneNo"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleChange}
                placeholder="Enter your phone number..."
                required
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Signup;
