import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useMyReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch user reports from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/reports/user/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Sort reports by status (Pending -> In Progress -> Resolved)
        const sortedReports = data.data.sort((a, b) => {
          const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Resolved': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        
        setReports(sortedReports);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete report
  const deleteReport = async (reportId) => {
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

      // Remove the deleted report from the state
      setReports(prev => prev.filter(report => report._id !== reportId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting report:', err);
      return { success: false, error: err.message };
    }
  };

  // Get report counts by status
  const getReportCounts = () => {
    const counts = {
      pending: 0,
      inProgress: 0,
      resolved: 0
    };

    reports.forEach(report => {
      switch (report.status) {
        case 'Pending':
          counts.pending++;
          break;
        case 'In Progress':
          counts.inProgress++;
          break;
        case 'Resolved':
          counts.resolved++;
          break;
        default:
          break;
      }
    });

    return counts;
  };

  // Filter reports by status
  const getReportsByStatus = (status) => {
    return reports.filter(report => report.status === status);
  };

  // Fetch reports when component mounts
  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  return {
    reports,
    loading,
    error,
    fetchReports,
    deleteReport,
    getReportCounts,
    getReportsByStatus
  };
};

export default useMyReport;
