import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, reportsAPI } from '../services/api';

const useProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    role: '',
    profileImage: null,
    stats: {
      totalReports: 0,
      pendingReports: 0,
      resolvedReports: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user profile
      const profileResponse = await authAPI.getProfile();
      const profile = profileResponse.data;

      // Fetch user stats based on role
      console.log('Fetching user stats for role:', profile.role);
      let statsResponse;
      if (profile.role === 'admin') {
        console.log('Fetching admin stats...');
        statsResponse = await reportsAPI.getAdminStats();
      } else {
        console.log('Fetching user stats...');
        statsResponse = await reportsAPI.getUserStats();
      }
      console.log('Stats API Response:', statsResponse);
      const stats = statsResponse.data;
      console.log('Extracted stats:', stats);

      setProfileData({
        username: profile.username || 'User',
        email: profile.email || 'user@example.com',
        role: profile.role || 'student',
        profileImage: profile.profileImage || null,
        stats: {
          totalReports: stats.totalReports || 0,
          pendingReports: stats.pendingReports || 0,
          resolvedReports: stats.resolvedReports || 0
        }
      });

    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.message);
      
      // Fallback to user data from context
      setProfileData({
        username: user?.username || 'User',
        email: user?.email || 'user@example.com',
        role: user?.role || 'student',
        profileImage: user?.profileImage || null,
        stats: {
          totalReports: 0,
          pendingReports: 0,
          resolvedReports: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfileImage = async (imageFile) => {
    try {
      const response = await authAPI.updateProfileImage(imageFile);
      // Backend returns { success: true, user: {...} }
      const updatedUser = response.user;
      
      setProfileData(prev => ({
        ...prev,
        profileImage: updatedUser.profileImage
      }));
      
      return updatedUser;
    } catch (err) {
      console.error('Error updating profile image:', err);
      throw err;
    }
  };

  const refreshStats = async () => {
    try {
      console.log('Refreshing user stats for role:', user?.role);
      let statsResponse;
      if (user?.role === 'admin') {
        console.log('Refreshing admin stats...');
        statsResponse = await reportsAPI.getAdminStats();
      } else {
        console.log('Refreshing user stats...');
        statsResponse = await reportsAPI.getUserStats();
      }
      console.log('Refresh Stats API Response:', statsResponse);
      const stats = statsResponse.data;
      console.log('Refresh Extracted stats:', stats);
      
      setProfileData(prev => ({
        ...prev,
        stats: {
          totalReports: stats.totalReports || 0,
          pendingReports: stats.pendingReports || 0,
          resolvedReports: stats.resolvedReports || 0
        }
      }));
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return {
    profileData,
    loading,
    error,
    refreshProfile: fetchProfile,
    updateProfileImage,
    refreshStats
  };
};

export default useProfile;
