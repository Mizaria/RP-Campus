import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useAdminDashboard = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Fetch all reports
  const fetchAllReports = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setReports(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch reports');
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Get high priority reports (unassigned only)
  const getHighPriorityReports = () => {
    return reports.filter(report => report.priority === 'High' && !report.assignedTo);
  };

  // Get low priority reports (unassigned only)
  const getLowPriorityReports = () => {
    return reports.filter(report => report.priority === 'Low' && !report.assignedTo);
  };

  // Get unassigned reports only
  const getUnassignedReports = () => {
    return reports.filter(report => !report.assignedTo);
  };

  // Get report counts by priority (unassigned only)
  const getReportCounts = () => {
    const unassignedReports = getUnassignedReports();
    const highPriority = unassignedReports.filter(report => report.priority === 'High').length;
    const lowPriority = unassignedReports.filter(report => report.priority === 'Low').length;
    
    return {
      high: highPriority,
      low: lowPriority,
      total: unassignedReports.length
    };
  };

  // Get report counts by status
  const getStatusCounts = () => {
    const pending = reports.filter(report => report.status === 'Pending').length;
    const inProgress = reports.filter(report => report.status === 'In Progress').length;
    const resolved = reports.filter(report => report.status === 'Resolved').length;
    const cancelled = reports.filter(report => report.status === 'Cancelled').length;
    
    return {
      pending,
      inProgress,
      resolved,
      cancelled,
      total: reports.length
    };
  };

  // Refresh reports after admin actions
  const refreshReports = () => {
    fetchAllReports();
  };

  // Update a specific report in the state
  const updateReportInState = (updatedReport) => {
    setReports(prevReports => 
      prevReports.map(report => 
        report._id === updatedReport._id ? updatedReport : report
      )
    );
  };

  // Remove a report from the state
  const removeReportFromState = (reportId) => {
    setReports(prevReports => 
      prevReports.filter(report => report._id !== reportId)
    );
  };

  // Fetch reports on component mount
  useEffect(() => {
    fetchAllReports();
  }, [token]);

  return {
    reports,
    loading,
    error,
    getHighPriorityReports,
    getLowPriorityReports,
    getReportCounts,
    getStatusCounts,
    refreshReports,
    updateReportInState,
    removeReportFromState,
    fetchAllReports
  };
};

export default useAdminDashboard;
