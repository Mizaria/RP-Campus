import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get token helper function
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Check if user is logged in when component mounts
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('AuthContext: Loading user from localStorage');
    console.log('Saved user string:', savedUser);
    
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      console.log('Parsed user data:', parsedUser);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData, token) => {
    console.log('Logging in user with data:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateUser,
      token: getToken()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
