// Simple test component to verify Profile.js works
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Profile from './pages/Profile';
import Login from './pages/Login'; // Assuming this exists

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
