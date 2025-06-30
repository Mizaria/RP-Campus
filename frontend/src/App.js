import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages (we'll create these next)
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupProfileImg from './pages/SignupProfileImg';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import MyReports from './pages/MyReports';
import Profile from './pages/Profile';

// Import components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import AuthProvider and useAuth
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }

  return (
    <div className="App">
      {user && <Navbar />}
      
      {/* <Container maxWidth="lg" sx={{ mt: user ? 4 : 0, mb: 4 }}> */}
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login />} 
          />          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" /> : <Signup />} 
          />
          <Route 
            path="/signup-profile" 
            element={user ? <Navigate to="/dashboard" /> : <SignupProfileImg />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/new" 
            element={
              <ProtectedRoute>
                <ReportForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
          
          {/* Catch all route */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      {/* </Container> */}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
