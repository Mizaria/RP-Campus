import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useAdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Fetch all admin tasks assigned to the current user
  const fetchMyTasks = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-tasks/user/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tasks');
      }

      console.log('Fetched admin tasks:', data.data);
      
      // Debug: Check the structure of tasks and their reportId data
      if (data.data && data.data.length > 0) {
        console.log('First task structure:', {
          taskId: data.data[0]._id,
          status: data.data[0].status,
          priority: data.data[0].priority,
          reportId: data.data[0].reportId,
          reportData: data.data[0].reportId ? {
            category: data.data[0].reportId.category,
            description: data.data[0].reportId.description,
            building: data.data[0].reportId.building,
            location: data.data[0].reportId.location,
            room: data.data[0].reportId.room,
            priority: data.data[0].reportId.priority
          } : 'No report data'
        });
      }
      
      setTasks(data.data || []);
    } catch (err) {
      console.error('Error fetching admin tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, API_BASE_URL]);

  // Update task status
  const updateTaskStatus = useCallback(async (taskId, status) => {
    try {
      console.log('Updating task status:', { taskId, status });
      
      const response = await fetch(`${API_BASE_URL}/api/admin-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task status');
      }

      // Instead of just updating with the response data (which doesn't include populated fields),
      // refresh the entire task list to get the latest populated data
      await fetchMyTasks();

      return {
        success: true,
        data: data.data,
        message: `Task status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [API_BASE_URL, fetchMyTasks]);

  // Complete task (mark as completed and update report to resolved)
  const completeTask = useCallback(async (taskId) => {
    try {
      console.log('Starting task completion for taskId:', taskId);
      
      // Find the task to get reportId before updating
      const task = tasks.find(t => t._id === taskId);
      if (!task || !task.reportId) {
        throw new Error('Task or report not found');
      }
      
      console.log('Found task:', {
        taskId: task._id,
        currentStatus: task.status,
        reportId: task.reportId._id,
        reportStatus: task.reportId.status
      });
      
      // First update task status to completed
      console.log('Updating task status to Completed...');
      const taskResult = await updateTaskStatus(taskId, 'Completed');
      
      if (!taskResult.success) {
        throw new Error(taskResult.error);
      }
      
      console.log('Task status updated successfully, now updating report status...');

      // Update the report status to resolved
      const reportResponse = await fetch(`${API_BASE_URL}/api/reports/${task.reportId._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Resolved' })
      });

      const reportData = await reportResponse.json();
      
      if (!reportResponse.ok) {
        console.error('Failed to update report status:', reportData);
        throw new Error(reportData.message || 'Failed to update report status');
      }
      
      console.log('Report status updated to Resolved successfully');

      return {
        success: true,
        message: 'Task completed and report resolved successfully!'
      };
    } catch (error) {
      console.error('Error completing task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [tasks, updateTaskStatus, API_BASE_URL]);

  // Remove task (delete task and unassign admin from report)
  const removeTask = useCallback(async (taskId) => {
    try {
      console.log('Removing task:', taskId);
      
      // Find the task to get reportId
      const task = tasks.find(t => t._id === taskId);
      if (!task || !task.reportId) {
        throw new Error('Task or report not found');
      }

      // First unassign admin from report
      const reportResponse = await fetch(`${API_BASE_URL}/api/reports/${task.reportId._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status: 'Pending',
          assignedTo: null 
        })
      });

      if (!reportResponse.ok) {
        const reportData = await reportResponse.json();
        throw new Error(reportData.message || 'Failed to unassign report');
      }

      // Then delete the admin task
      const taskResponse = await fetch(`${API_BASE_URL}/api/admin-tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!taskResponse.ok) {
        const taskData = await taskResponse.json();
        throw new Error(taskData.message || 'Failed to delete task');
      }

      // Remove task from local state
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));

      return {
        success: true,
        message: 'Task removed and report unassigned successfully!'
      };
    } catch (error) {
      console.error('Error removing task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [tasks, API_BASE_URL]);

  // Get tasks by status
  const getTasksByStatus = useCallback((status) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // Get task counts by status
  const getTaskCounts = useCallback(() => {
    return {
      toDo: tasks.filter(task => task.status === 'To Do').length,
      inProgress: tasks.filter(task => task.status === 'In Progress').length,
      draft: tasks.filter(task => task.status === 'Draft').length,
      completed: tasks.filter(task => task.status === 'Completed').length
    };
  }, [tasks]);

  // Progress task to next status
  const progressTask = useCallback(async (taskId, currentStatus) => {
    let nextStatus;
    
    switch (currentStatus) {
      case 'To Do':
        nextStatus = 'In Progress';
        break;
      case 'In Progress':
        nextStatus = 'Draft';
        break;
      default:
        return {
          success: false,
          error: 'Cannot progress task from this status'
        };
    }

    return await updateTaskStatus(taskId, nextStatus);
  }, [updateTaskStatus]);

  // Fetch tasks on component mount and user change
  useEffect(() => {
    if (user?.id) {
      fetchMyTasks();
    }
  }, [fetchMyTasks, user?.id]);

  return {
    tasks,
    loading,
    error,
    fetchMyTasks,
    updateTaskStatus,
    completeTask,
    removeTask,
    getTasksByStatus,
    getTaskCounts,
    progressTask,
    refreshTasks: fetchMyTasks
  };
};

export default useAdminTasks;
