import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');

    try {
      // Call your backend API
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        login(data.user, data.token);
        navigate('/dashboard');
        return { success: true };
      } else {
        // Login failed
        setError(data.message || 'Login failed');
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

  return {
    handleLogin,
    loading,
    error,
    clearError
  };
};
