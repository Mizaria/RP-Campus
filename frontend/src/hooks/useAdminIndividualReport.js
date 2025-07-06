import { useState, useEffect } from 'react';

const useAdminIndividualReport = (reportId) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Fetch individual report data
  const fetchReport = async () => {
    if (!reportId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch report');
      }

      setReport(data.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept report function
  const acceptReport = async () => {
    if (!reportId) return { success: false, error: 'No report ID provided' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept report');
      }

      // Update the report state with new data
      if (data.data && data.data.report) {
        setReport(data.data.report);
      }

      return {
        success: true,
        data: data.data,
        message: 'Report accepted successfully!'
      };
    } catch (err) {
      console.error('Error accepting report:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  // Format date to DD/M/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#FFA500';
      case 'In Progress':
        return '#E9D674';
      case 'Resolved':
        return '#76BB3F';
      default:
        return '#A7A7A7';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#E86464';
      case 'Medium':
        return '#FFA500';
      case 'Low':
        return '#76BB3F';
      default:
        return '#A7A7A7';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'electrical':
        return '/images/electrical.svg';
      case 'plumbing':
        return '/images/plumbing.svg';
      case 'furniture':
        return '/images/Furniture.svg';
      case 'sanitation':
        return '/images/sanitation.svg';
      case 'equipment':
        return '/images/equipment.svg';
      case 'it':
        return '/images/It.svg';
      default:
        return '/images/Icon.svg';
    }
  };

  // Get report ID display (last 4 characters)
  const getReportIdDisplay = (id) => {
    if (!id) return '#0000';
    return `#${id.toString().slice(-4)}`;
  };

  // Escalate report priority (Low -> High)
  const escalateReport = async () => {
    if (!reportId) return { success: false, error: 'No report ID provided' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          priority: 'High'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to escalate report');
      }

      // Update the report state
      if (data.data && data.data.report) {
        setReport(data.data.report);
      } else {
        // Refetch the report to get updated data
        await fetchReport();
      }

      return {
        success: true,
        data: data.data,
        message: 'Report priority escalated to High successfully!'
      };
    } catch (err) {
      console.error('Error escalating report:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  // De-escalate report priority (High -> Low)
  const deEscalateReport = async () => {
    if (!reportId) return { success: false, error: 'No report ID provided' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          priority: 'Low'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to de-escalate report');
      }

      // Update the report state
      if (data.data && data.data.report) {
        setReport(data.data.report);
      } else {
        // Refetch the report to get updated data
        await fetchReport();
      }

      return {
        success: true,
        data: data.data,
        message: 'Report priority de-escalated to Low successfully!'
      };
    } catch (err) {
      console.error('Error de-escalating report:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  // Delete report function
  const deleteReport = async () => {
    if (!reportId) return { success: false, error: 'No report ID provided' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete report');
      }

      return {
        success: true,
        data: data.data,
        message: 'Report deleted successfully!'
      };
    } catch (err) {
      console.error('Error deleting report:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  // Check if report can be escalated (currently Low priority)
  const canEscalate = () => {
    return report && report.priority === 'Low';
  };

  // Check if report can be de-escalated (currently High priority)
  const canDeEscalate = () => {
    return report && report.priority === 'High';
  };

  // Fetch report on component mount
  useEffect(() => {
    fetchReport();
  }, [reportId]);

  return {
    report,
    loading,
    error,
    acceptReport,
    escalateReport,
    deEscalateReport,
    deleteReport,
    canEscalate,
    canDeEscalate,
    formatDate,
    getStatusColor,
    getPriorityColor,
    getCategoryIcon,
    getReportIdDisplay,
    refetchReport: fetchReport
  };
};

export default useAdminIndividualReport;
