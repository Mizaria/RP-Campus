import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const useAnnouncements = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Create a new announcement
    const createAnnouncement = useCallback(async (announcementData) => {
        if (!token) {
            setError('Authentication token not found');
            return { success: false, error: 'Authentication token not found' };
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(announcementData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create announcement');
            }

            return { success: true, announcement: data.announcement };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Get all announcements
    const getAnnouncements = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch announcements');
            }

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Get my announcements (admin only)
    const getMyAnnouncements = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements/my-announcements?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch your announcements');
            }

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Update announcement
    const updateAnnouncement = useCallback(async (id, announcementData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(announcementData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update announcement');
            }

            return { success: true, announcement: data.announcement };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Delete announcement
    const deleteAnnouncement = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete announcement');
            }

            return { success: true, message: data.message };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Get announcement statistics
    const getAnnouncementStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch announcement statistics');
            }

            return { success: true, stats: data.stats };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [token]);

    return {
        loading,
        error,
        createAnnouncement,
        getAnnouncements,
        getMyAnnouncements,
        updateAnnouncement,
        deleteAnnouncement,
        getAnnouncementStats
    };
};
