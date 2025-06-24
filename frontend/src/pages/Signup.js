import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../images/Logo.png';
import '../../styles/SignUp.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email,
          name: formData.firstName + ' ' + formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Signup successful! Please login.');
        navigate('/login');
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      alert('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
        </div>
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" placeholder="Enter your first name..." value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" placeholder="Enter your last name..." value={formData.lastName} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email..." value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="phone">Phone No.</label>
            <input type="text" id="phone" placeholder="Enter your phone number..." value={formData.phone} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password..." value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="login-button" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
      </main>
    </div>
  );
};

// export default Signup;
