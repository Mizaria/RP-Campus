import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const useReportUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get token from localStorage directly to ensure we have it
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    building: '',
    location: '',
    room: ''
  });

  const [originalReport, setOriginalReport] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false); // Track if user wants to remove image
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Base URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Fetch the report data on component mount
  useEffect(() => {
    let loadingTimeoutId = null;

    const fetchReport = async () => {
      console.log('=== DEBUGGING REPORT FETCH ===');
      console.log('1. Report ID from params:', id);
      console.log('2. Token available:', !!token);
      console.log('3. Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
      console.log('4. API_BASE_URL:', API_BASE_URL);
      console.log('5. Full fetch URL:', `${API_BASE_URL}/api/reports/${id}`);

      if (!id) {
        console.error('❌ No report ID provided');
        setIsLoading(false);
        alert('No report ID provided');
        navigate('/myreports');
        return;
      }

      if (!token) {
        console.error('❌ No authentication token');
        setIsLoading(false);
        alert('Authentication required');
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        console.log('📡 Making API call...');
        
        const controller = new AbortController();
        const requestTimeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(requestTimeoutId);
        console.log('📨 Response received:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`Failed to fetch report: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ API Response success:', result);
        const report = result.data;

        if (!report) {
          throw new Error('No report data received');
        }

        console.log('📋 Report data:', {
          id: report._id,
          status: report.status,
          category: report.category,
          hasPhoto: !!report.photoUrl
        });

        // Check if report can be updated (only pending status)
        if (report.status !== 'Pending') {
          console.warn('⚠️ Report is not pending, cannot edit');
          alert('Only pending reports can be updated');
          navigate('/myreports');
          return;
        }

        setOriginalReport(report);
        setFormData({
          category: report.category || '',
          description: report.description || '',
          building: report.building || '',
          location: report.location || '',
          room: report.room || ''
        });

        // Set image preview if report has an image
        if (report.photoUrl) {
          setImagePreview(`${API_BASE_URL}${report.photoUrl}`);
          setImageRemoved(false); // Reset removed flag when loading existing image
        } else {
          setImagePreview(null);
          setImageRemoved(false);
        }

        console.log('✅ Report data loaded successfully');

      } catch (error) {
        console.error('❌ Error fetching report:', error);
        if (error.name === 'AbortError') {
          alert('Request timeout. Please check your connection and try again.');
        } else {
          alert(`Error loading report data: ${error.message}`);
        }
        navigate('/myreports');
      } finally {
        setIsLoading(false);
        // Clear loading timeout since we finished loading
        if (loadingTimeoutId) {
          console.log('🧹 Clearing loading timeout');
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = null;
        }
      }
    };

    // Set a loading timeout to prevent infinite loading
    loadingTimeoutId = setTimeout(() => {
      console.error('⏰ Loading timeout reached (10 seconds)');
      setIsLoading(false);
      alert('Loading timeout. Please check your connection and try again.');
      navigate('/myreports');
    }, 10000); // 10 second timeout

    // Add a small delay to ensure all dependencies are ready, then fetch
    const timeoutId = setTimeout(() => {
      fetchReport();
    }, 100);

    return () => {
      console.log('🧹 Cleanup: clearing timeouts');
      clearTimeout(timeoutId);
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
    };
  }, [id, token, navigate, API_BASE_URL]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setUploadedImage(file);
      setImageRemoved(false); // Reset removed flag when new image is uploaded
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageRemoved(true); // Mark image as removed
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    if (!formData.building || formData.building.trim().length === 0) {
      newErrors.building = 'Building is required';
    }

    if (!formData.location || formData.location.trim().length === 0) {
      newErrors.location = 'Location is required';
    }

    if (!formData.room || formData.room.trim().length === 0) {
      newErrors.room = 'Room is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit updated report
  const updateReport = async () => {
    if (!validateForm()) {
      return { success: false, error: 'Please fix the validation errors' };
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Handle image logic
      if (uploadedImage) {
        // User uploaded a new image
        formDataToSend.append('photo', uploadedImage);
      } else if (imageRemoved) {
        // User wants to remove the image entirely
        formDataToSend.append('photoUrl', ''); // Send empty string to remove image
      }
      // If neither condition is true, keep the existing image (don't send photo field)

      const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update report');
      }

      return { 
        success: true, 
        message: 'Report updated successfully!',
        data: result.data
      };

    } catch (error) {
      console.error('Error updating report:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update report'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    originalReport,
    uploadedImage,
    imagePreview,
    isSubmitting,
    isLoading,
    errors,
    handleInputChange,
    handleImageUpload,
    removeImage,
    updateReport,
    navigate
  };
};

export default useReportUpdate;
