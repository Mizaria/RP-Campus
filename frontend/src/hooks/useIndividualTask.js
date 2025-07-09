import { useState, useEffect } from 'react';

const useIndividualTask = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // Fetch individual task data
  const fetchTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch task');
      }

      setTask(data.data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete task function
  const completeTask = async () => {
    if (!taskId) return { success: false, error: 'No task ID provided' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'Completed'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete task');
      }

      // Update the task state with new data
      if (data.data && data.data.task) {
        setTask(data.data.task);
      }

      return {
        success: true,
        data: data.data,
        message: 'Task completed successfully!'
      };
    } catch (err) {
      console.error('Error completing task:', err);
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
      case 'Completed':
        return '#76BB3F';
      case 'Draft':
        return '#A7A7A7';
      default:
        return '#A7A7A7';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#E86464';
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

  // Get task ID display (last 4 characters)
  const getTaskIdDisplay = (id) => {
    if (!id) return '#0000';
    return `#${id.toString().slice(-4)}`;
  };

  // Fetch task on component mount
  useEffect(() => {
    fetchTask();
  }, [taskId]);

  return {
    task,
    loading,
    error,
    completeTask,
    formatDate,
    getStatusColor,
    getPriorityColor,
    getCategoryIcon,
    getTaskIdDisplay,
    refetchTask: fetchTask
  };
};

export default useIndividualTask;
