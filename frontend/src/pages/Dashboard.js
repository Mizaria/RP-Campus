import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to RP Campus Care Dashboard, {user?.username || 'User'}!</p>
    </div>
  );
};

export default Dashboard;
