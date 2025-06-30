import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Call your backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role || 'student'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Signup successful
        setSuccess(true);
        
        // Store token for profile image step
        sessionStorage.setItem('signupToken', data.token);
        
        return { 
          success: true, 
          userData: data.user, 
          token: data.token 
        };
      } else {
        // Signup failed
        setError(data.message || 'Registration failed');
        return { success: false, error: data.message };
      }
    } catch (err) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError('');
  const clearSuccess = () => setSuccess(false);

  return {
    handleSignup,
    loading,
    error,
    success,
    clearError,
    clearSuccess
  };
};
