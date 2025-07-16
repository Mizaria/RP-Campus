// Test script to check user stats API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const testUserStats = async () => {
  try {
    const token = localStorage.getItem('token');
    
    console.log('Testing user stats API...');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('API URL:', `${API_BASE_URL}/api/reports/user-stats`);
    
    const response = await fetch(`${API_BASE_URL}/api/reports/user-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    return data;
  } catch (error) {
    console.error('Error testing user stats:', error);
    throw error;
  }
};

// Export for use in console
window.testUserStats = testUserStats;

export default testUserStats;
