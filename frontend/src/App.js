import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages (we'll create these next)
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupProfileImg from './pages/SignupProfileImg';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import ReportUpdate from './pages/ReportUpdate';
import MyReports from './pages/MyReports';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AdminProfile from './pages/AdminProfile';
import AdminDashboard from './pages/AdminDashboard';
import IndiReport from './pages/IndiReport';
import AdminTask from './pages/MyTask'; 
import AdminHistory from './pages/History';
import AdminIndiReport from './pages/AdmindiReport';
import IndiTask from './pages/IndiTask';
import Notification from './pages/AllNotification';
import AdminSignup from './pages/SignupAdmin';
import Chat from './pages/Chat';
import ChatMessage from './pages/ChatMessage';
import AnnouncementForm from './pages/AnnouncementForm';

// Import components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import AuthProvider and useAuth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';

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
           <Route 
            path="/signup-admin" 
            element={user ? <Navigate to="/dashboard" /> : <AdminSignup />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {user && user.role === 'admin' ? <AdminDashboard /> : <Dashboard />}
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
            path="/mytasks" 
            element={
              <ProtectedRoute>
                <AdminTask />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <AdminHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/:id/edit" 
            element={
              <ProtectedRoute>
                <ReportUpdate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/:id" 
            element={
              <ProtectedRoute>
                <IndiReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/report/:id" 
            element={
              <ProtectedRoute>
                <AdminIndiReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/task/:id" 
            element={
              <ProtectedRoute>
                <IndiTask />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notification/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:userId" 
            element={
              <ProtectedRoute>
                <ChatMessage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/announcement-form" 
            element={
              <ProtectedRoute>
                <AnnouncementForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/announcement-form" 
            element={
              <ProtectedRoute>
                <AnnouncementForm />
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
          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute>
                <ProfileEdit />
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
      <NotificationProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
