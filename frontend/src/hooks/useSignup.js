import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

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
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          studentId: formData.studentId,
          role: formData.role || 'student'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Signup successful
        setSuccess(true);
        
        // Auto-login after successful signup
        login(data.user, data.token);
        
        // Navigate to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
        return { success: true };
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
