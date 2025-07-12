import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useAdminReports = () => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Base URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Accept a report
  const acceptReport = async (reportId) => {
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to accept report');
      }

      return { 
        success: true, 
        message: 'Report accepted successfully!',
        data: result.data
      };

    } catch (error) {
      console.error('Error accepting report:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to accept report'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update report priority (escalate/de-escalate)
  const updateReportPriority = async (reportId, newPriority) => {
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    setIsSubmitting(true);

    try {
      console.log('Updating report priority:', { reportId, newPriority, token: token ? 'present' : 'missing' });
      
      const requestBody = { priority: newPriority };
      console.log('Request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update report priority');
      }

      return { 
        success: true, 
        message: `Report priority updated to ${newPriority}!`,
        data: result.data
      };

    } catch (error) {
      console.error('Error updating report priority:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update report priority'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete report
  const deleteReport = async (reportId) => {
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete report');
      }

      return { 
        success: true, 
        message: 'Report deleted successfully!'
      };

    } catch (error) {
      console.error('Error deleting report:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete report'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    acceptReport,
    updateReportPriority,
    deleteReport,
    isSubmitting
  };
};

export default useAdminReports;
