const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Auth API
export const authAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update profile image
  updateProfileImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('profileImage', imageFile);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/auth/profile-image`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  },

  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  // Register
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  }
};

// Reports API
export const reportsAPI = {
  // Get user statistics
  getUserStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/reports/user-stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get user reports
  getUserReports: async () => {
    const response = await fetch(`${API_BASE_URL}/api/reports/user/me`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create report
  createReport: async (reportData) => {
    const formData = new FormData();
    Object.keys(reportData).forEach(key => {
      if (reportData[key] !== null && reportData[key] !== undefined) {
        formData.append(key, reportData[key]);
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  },

  // Get single report
  getReport: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update report
  updateReport: async (id, reportData) => {
    const formData = new FormData();
    Object.keys(reportData).forEach(key => {
      if (reportData[key] !== null && reportData[key] !== undefined) {
        formData.append(key, reportData[key]);
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  },

  // Delete report
  deleteReport: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// General API utilities
export const apiUtils = {
  // Get image URL
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  },

  // Upload file
  uploadFile: async (file, endpoint) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  }
};

export default {
  authAPI,
  reportsAPI,
  apiUtils
};
