import React, { useState } from 'react';
import { useLogin } from '../hooks/useLogin';
import { Link } from 'react-router-dom';
import './Login.css';
import backgroundImage from '../assets/images/background.png';
import logoImage from '../assets/images/Logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, loading, error } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };
  return (
    <div className="login-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
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
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
