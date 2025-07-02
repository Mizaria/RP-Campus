import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useReportForm = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    building: '',
    location: '',
    room: '',
    category: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 5MB'
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      setUploadedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous image errors
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    
    // Clear any image errors
    if (errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.building.trim()) {
      newErrors.building = 'Building name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Floor/Location is required';
    }

    if (!formData.room.trim()) {
      newErrors.room = 'Room is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitReport = async () => {
    if (!validateForm()) {
      return { success: false, error: 'Please fix the validation errors' };
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('building', formData.building.trim());
      submitData.append('location', formData.location.trim());
      submitData.append('room', formData.room.trim());
      submitData.append('category', formData.category);
      submitData.append('description', formData.description.trim());
      submitData.append('priority', 'Low'); // Default priority
      submitData.append('email', user.email);

      if (uploadedImage) {
        submitData.append('photo', uploadedImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Report created successfully:', result);
        
        // Reset form
        resetForm();
        
        return { 
          success: true, 
          data: result,
          message: 'Report created successfully!' 
        };
      } else {
        const error = await response.json();
        console.error('Error creating report:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to create report' 
        };
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      building: '',
      location: '',
      room: '',
      category: '',
      description: ''
    });
    setUploadedImage(null);
    setImagePreview(null);
    setErrors({});
  };

  return {
    // Form state
    formData,
    uploadedImage,
    imagePreview,
    isSubmitting,
    errors,

    // Form actions
    handleInputChange,
    handleImageUpload,
    removeImage,
    submitReport,
    resetForm,

    // Utility
    user,
    navigate
  };
};

export default useReportForm;
