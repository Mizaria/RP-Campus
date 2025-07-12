import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useIndividualReport = (reportId) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch single report from API
  const fetchReport = async () => {
    if (!reportId) {
      setError('No report ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found');
        } else if (response.status === 403) {
          throw new Error('You are not authorized to view this report');
        } else {
          throw new Error(`Failed to fetch report: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (data.success) {
        setReport(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch report');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete report
  const deleteReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete report: ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting report:', err);
      return { success: false, error: err.message };
    }
  };

  // Format date to DD/M/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#A7A7A7';
      case 'In Progress':
        return '#E9D674';
      case 'Resolved':
        return '#76BB3F';
      default:
        return '#A7A7A7';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Electrical':
        return '/images/electrical.svg';
      case 'Plumbing':
        return '/images/plumbing.svg';
      case 'IT':
        return '/images/It.svg';
      case 'Furniture':
        return '/images/Furniture.svg';
      case 'Equipment':
        return '/images/equipment.svg';
      case 'Sanitation':
        return '/images/sanitation.svg';
      default:
        return '/images/It.svg';
    }
  };

  // Get first 4 digits of report ID
  const getReportIdDisplay = (id) => {
    return `#${id.toString().slice(-4)}`;
  };

  // Fetch report when component mounts or reportId changes
  useEffect(() => {
    if (user && reportId) {
      fetchReport();
    }
  }, [user, reportId]);

  return {
    report,
    loading,
    error,
    fetchReport,
    deleteReport,
    formatDate,
    getStatusColor,
    getCategoryIcon,
    getReportIdDisplay
  };
};

export default useIndividualReport;
