import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationIcon from '../components/NotificationIcon';
import AIChatBot from '../components/AIChatBot';
import useIndividualTask from '../hooks/useIndividualTask';
import useAdminTasks from '../hooks/useAdminTasks';
import useToast from '../hooks/useToast';
import { ToastContainer } from '../components/common/Toast';
import '../assets/styles/IndiTask.css';
import backgroundImage from '../assets/images/adminmainbackground.svg';

// Base URL for API calls from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Image Upload Modal Component
const ImageUploadModal = ({ isOpen, onClose, onImageUpload }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay-update" 
      onClick={onClose}
    >
      <div 
        className="modal-content-update" 
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="img-add-container">
          <img
            src="/images/imageupload 1.svg"
            alt="Add Image Icon"
            className="add-image-icon"
            width="130px"
          />
          <p className="add-image-text">Image of fault (optional)</p>
          <div className="line-divider"></div>
          <div className="image-btn-container">
            <label htmlFor="fileInput" className="image-input">
              <img
                src="/images/Plus.svg"
                alt="Upload Icon"
                className="upload-icon"
                width="15px"
                height="15px"
              />
              Upload
            </label>
            <input 
              type="file" 
              id="fileInput" 
              accept="image/*"
              onChange={onImageUpload}
              style={{ display: "none" }} 
            />
            <label htmlFor="cameraInput" className="image-input">
              Use Camera
            </label>
            <input
              type="file"
              id="cameraInput"
              accept="image/*"
              capture="environment"
              onChange={onImageUpload}
              className="image-input"
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SecNav = ({ task, onRemoveTask }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const report = task?.reportId;

    // Debug: Log user data to see if profileImage is included
    useEffect(() => {
        console.log('Dashboard user data:', user);
        console.log('API_BASE_URL:', API_BASE_URL);
        if (user?.profileImage) {
            console.log('Constructed image URL:', `${API_BASE_URL}/uploads/${user.profileImage}`);
        }
    }, [user]);

    const toggleNavbar = () => {
        setIsNavbarVisible(!isNavbarVisible);
        // Dispatch custom event to toggle navbar
        window.dispatchEvent(new CustomEvent('toggleNavbar', {
            detail: { isVisible: !isNavbarVisible }
        }));
    };

    // Listen for navbar toggle events from other components
    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    const toggleModel = () => {
        // Dispatch custom event to toggle modal
        window.dispatchEvent(new CustomEvent('toggleModal', {
            detail: { isOpen: true }
        }));
    };
    return (
        <div className="mainBackground" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="nav-bar">
                <div className="bar-item-menu" onClick={toggleNavbar}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-item-modal" onClick={toggleModel}>
                    <img src="/images/Menu Icon.svg" alt="Menu Icon" width="20px" height="20px" />
                </div>
                <div className="bar-search">
                    <img src="/images/Search Icon.svg" alt="Search Icon" width="20px" height="20px" />
                    <input type="text" placeholder="Search report..." />
                </div>
                <NotificationIcon onClick={() => navigate('/notifications')} />
            </div>
            <div className="main-content">
                <div className="Page-header">
                    <h2>Task Details</h2>
                    <p style={{ paddingTop: 4 }}>{task ? `#${task._id.toString().slice(-4)}` : '#----'}</p>
                </div>
                {task && task.status !== 'Completed' && (
                <div className="main-right" onClick={(e) => e.stopPropagation()}>
            <li>
              <img src="/images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px"
                height="22px" />
              <ul className="dropdown">
                <li onClick={onRemoveTask}>
                  <img src="/images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px"
                    height="22px" />Remove Task
                </li>
              </ul>
            </li>
          </div>
                )}
            </div>
        </div>
    );
};
const IndiTask = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    // Use the custom hook to fetch task data
    const {
        task,
        loading,
        error,
        completeTask,
        formatDate,
        getStatusColor,
        getPriorityColor,
        getCategoryIcon,
        getTaskIdDisplay,
        refetchTask
    } = useIndividualTask(id);

    // Use admin tasks hook for remove functionality
    const { removeTask } = useAdminTasks();

    // Use toast notifications
    const { toasts, removeToast, showSuccess, showError } = useToast();

    // Get the report data from the task
    const report = task?.reportId;

    // Load existing comment data when task loads
    useEffect(() => {
        if (report?.comments && report.comments.length > 0) {
            const latestComment = report.comments[report.comments.length - 1];
            setCommentText(latestComment.commentText || '');
            if (latestComment.photoUrl) {
                setImagePreview(`${API_BASE_URL}${latestComment.photoUrl}`);
            }
        } else if (task?.notes && task.notes.length > 0) {
            const latestNote = task.notes[task.notes.length - 1];
            setCommentText(latestNote.text || '');
            if (latestNote.photoUrl) {
                setImagePreview(`${API_BASE_URL}${latestNote.photoUrl}`);
            }
        }
    }, [task, report, API_BASE_URL]);

    // Debug logging
    useEffect(() => {
        if (task) {
            console.log('Task data:', task);
            console.log('Report data:', report);
            console.log('Report comments:', report?.comments);
            console.log('Report building:', report?.building);
            console.log('Report location:', report?.location);
            console.log('Report room:', report?.room);
            console.log('Report priority:', report?.priority);
            console.log('Report photoUrl:', report?.photoUrl);
            console.log('Report reporter:', report?.reporter);
        }
    }, [task, report]);

    // Handle complete task
    const handleCompleteTask = async () => {
        if (window.confirm('Are you sure you want to mark this task as completed?')) {
            const result = await completeTask();
            if (result.success) {
                console.log('Task completed successfully');
                navigate('/mytasks'); // Navigate back to tasks list
            } else {
                alert('Failed to complete task: ' + result.error);
            }
        }
    };

    // Handle remove task with enhanced deletion of comments and images
    const handleRemoveTask = async () => {
        if (window.confirm('Are you sure you want to remove this task? This will delete all associated comments, images, and unassign the report making it available for other admins.')) {
            try {
                // First, clear comments from the report using the new endpoint
                if (task?.reportId && task.reportId._id) {
                    try {
                        console.log(`Attempting to clear comments for report ID: ${task.reportId._id}`);
                        const clearCommentsResponse = await fetch(`${API_BASE_URL}/api/reports/${task.reportId._id}/comments`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        
                        if (clearCommentsResponse.ok) {
                            const result = await clearCommentsResponse.json();
                            console.log('Comments cleared successfully:', result);
                        } else {
                            const errorText = await clearCommentsResponse.text();
                            console.error('Failed to clear comments:', clearCommentsResponse.status, errorText);
                            showError(`Failed to clear comments: ${clearCommentsResponse.status}`);
                        }
                    } catch (commentError) {
                        console.error('Error clearing comments:', commentError);
                        showError('Error clearing comments: ' + commentError.message);
                        // Continue with task removal even if comment clearing fails
                    }
                }

                // Then remove the task
                const result = await removeTask(id);
                if (result.success) {
                    showSuccess('Task, comments, and images removed successfully!');
                    navigate('/mytasks'); // Navigate back to tasks list
                } else {
                    showError('Failed to remove task: ' + result.error);
                }
            } catch (error) {
                console.error('Error in handleRemoveTask:', error);
                showError('Failed to remove task and associated data');
            }
        }
    };

    // Handle image upload
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
                setSelectedImage(file);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove uploaded image
    const removeImage = () => {
        setImagePreview(null);
        setSelectedImage(null);
        // Note: This only removes the preview. To delete a saved image, 
        // you would need to implement a delete API endpoint
    };

    // Toggle modal
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Handle image upload from modal
    const handleImageUploadWithModal = (e) => {
        handleImageUpload(e);
        // Close modal after upload
        setIsModalOpen(false);
    };

    // Save comment and image
    const handleSaveComment = async () => {
        if (!commentText.trim()) {
            alert('Please enter a comment');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('commentText', commentText);
            if (selectedImage) {
                formData.append('photo', selectedImage);
            }

            const response = await fetch(`${API_BASE_URL}/api/reports/${report._id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const responseData = await response.json();
                alert('Comment saved successfully');

                // Update the UI immediately with what was saved
                if (responseData.data && responseData.data.comment) {
                    const savedComment = responseData.data.comment;
                    
                    // Update the comment text to match what was saved
                    setCommentText(savedComment.commentText || commentText);
                    
                    // Update image preview to show the saved image URL
                    if (savedComment.photoUrl) {
                        setImagePreview(`${API_BASE_URL}${savedComment.photoUrl}`);
                    }
                    
                    // Clear the selected file since it's now saved
                    setSelectedImage(null);
                }

                // Refresh the task data to get updated comments
                await refetchTask();
            } else {
                const errorData = await response.json();
                alert(`Failed to save comment: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving comment:', error);
            alert('Error saving comment');
        }
    };
    // Listen for navbar toggle events from other components
    useEffect(() => {
        const handleNavbarToggle = (event) => {
            setIsNavbarVisible(event.detail.isVisible);
        };

        window.addEventListener('toggleNavbar', handleNavbarToggle);
        return () => {
            window.removeEventListener('toggleNavbar', handleNavbarToggle);
        };
    }, []);

    // Get building background color
    const getBuildingColor = (building) => {
        if (!building) return '#E0E0E0';

        const buildingCode = building.toUpperCase();

        switch (buildingCode) {
            case 'E4':
            case 'E5':
                return '#E0F1EB';
            case 'W2':
            case 'W1':
                return '#E6F3F5';
            case 'W3':
            case 'W5':
                return '#F5E6F1';
            case 'E2':
                return '#EFE7F2';
            case 'E1':
                return '#EAF3DE';
            case 'E6':
                return '#F1EFCD';
            case 'W4':
                return '#EAE5CB';
            case 'W6':
                return '#EAE0D8';
            default:
                return '#E0E0E0';
        }
    };

    return (
        <div className={`dashboard ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
            <SecNav task={task} onRemoveTask={handleRemoveTask} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="dashboard-content">
                {loading ? (
                    <div className="loading-message">
                        <p>Loading task details...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <p>Error loading task: {error}</p>
                        <button onClick={() => navigate(-1)} className="retry-button">
                            Go Back
                        </button>
                    </div>
                ) : !task || !report ? (
                    <div className="no-report-message">
                        <p>Task not found.</p>
                        <button onClick={() => navigate(-1)} className="retry-button">
                            Go Back
                        </button>
                    </div>
                ) : (
                    <div className="report-info-container">
                        <div className="report-left-indi">
                            <div className="report-info-title">
                                <p>Task Information</p>
                                <img
                                    src={getCategoryIcon(report?.category)}
                                    alt="Report Icon"
                                    className="report-type-icon"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            <div className="report-info">
                                <p>Location:</p>
                                <div className="report-location-s" style={{ backgroundColor: getBuildingColor(report?.building) }}>
                                    {report?.building || 'N/A'}, {report?.location || 'N/A'}, {report?.room || 'N/A'}
                                </div>
                            </div>
                            <div className="report-info">
                                <p>Category:</p>
                                <div>{report?.category || 'N/A'} Problem</div>
                            </div>
                            <div className="report-info">
                                <p>Created At:</p>
                                <div>{formatDate(report?.createdAt)}</div>
                            </div>
                            <div className="report-info">
                                <p>Priority:</p>
                                <div className="status-info">
                                    <div className="staus-circle-s" style={{ backgroundColor: getPriorityColor(report?.priority) }} />
                                    {report?.priority || 'N/A'}
                                </div>
                            </div>
                            <div className="report-info-des">
                                <p>Description:</p>
                                <div className="des-textbox">{report?.description || 'No description'}</div>
                            </div>
                        </div>
                        <div className="report-right">
                            {report?.photoUrl ? (
                                <div className="report-image-container">
                                    <img
                                        src={`${API_BASE_URL}${report.photoUrl}`}
                                        alt="Report"
                                        className="report-image"
                                        style={{ height: "100%" }}
                                        onError={(e) => {
                                            console.log('Main image load error, URL:', e.target.src);
                                            e.target.style.display = 'none';
                                            e.target.parentElement.style.display = 'none';
                                            e.target.parentElement.nextElementSibling.style.display = 'block';
                                        }}
                                    />
                                </div>
                            ) : null}
                            {!report?.photoUrl && (
                                <div className="report-image-container">
                                    <div className="no-img">
                                        <img
                                            src="/images/noimg 1.svg"
                                            alt="No Image"
                                            className="no-image-icon"
                                            width={120}
                                            height={120}
                                        />
                                        <p>No Image Added</p>
                                    </div>
                                </div>
                            )}
                            <div className="assigned-to">
                                Report Creator: {
                                    report?.reporter && report.reporter.username
                                        ? report.reporter.username
                                        : 'Unknown'
                                }
                            </div>
                        </div>
                        {/* Additional Information Section - Conditional based on task status */}
                        <h2 className="page-title" style={{ width: "100%" }}>Additional Information</h2>

                        {/* If task is completed, show read-only version */}
                        {task?.status === 'Completed' ? (
                            <div className="additional-information">
                                <div className="remark">
                                    <div className="report-info-des">
                                        <p>Remark:</p>
                                        <div className="des-textbox">
                                            {report?.comments && report.comments.length > 0
                                                ? report.comments[report.comments.length - 1].commentText || 'No comment text'
                                                : (task?.notes && task.notes.length > 0
                                                    ? task.notes[task.notes.length - 1].text || 'No note text'
                                                    : 'No remarks')
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="additional-img">
                                    {/* Show comment photo if available */}
                                    {report?.comments && report.comments.length > 0 && report.comments[report.comments.length - 1].photoUrl ? (
                                       
                                            <img
                                                src={`${API_BASE_URL}${report.comments[report.comments.length - 1].photoUrl}`}
                                                alt="Comment Image"
                                                className="report-image"
                                                style={{ height: "100%" }}
                                                onError={(e) => {
                                                    console.log('Comment image load error, URL:', e.target.src);
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.style.display = 'none';
                                                    e.target.parentElement.nextElementSibling.style.display = 'block';
                                                }}
                                            />
                                        
                                    ) : (task?.notes && task.notes.length > 0 && task.notes[task.notes.length - 1].photoUrl ? (
                                        <div className="report-image-container">
                                            <img
                                                src={`${API_BASE_URL}${task.notes[task.notes.length - 1].photoUrl}`}
                                                alt="Task Note Image"
                                                className="report-image"
                                                style={{ height: "100%" }}
                                                onError={(e) => {
                                                    console.log('Task note image load error, URL:', e.target.src);
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.style.display = 'none';
                                                    e.target.parentElement.nextElementSibling.style.display = 'block';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="no-img">
                                            <img
                                                src="/images/noimg 1.svg"
                                                alt="No Image"
                                                className="no-image-icon"
                                                width={120}
                                                height={120}
                                            />
                                            <p>No Image Added</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* If task is To Do, In Progress, or Draft, show editable version */
                            <div className="additional-information">
                                <div className="remark-task">
                                    <div className="report-info-des">
                                        <label htmlFor="comment">Remark:</label>
                                        <textarea
                                            id="comment"
                                            name="comment"
                                            placeholder="Remarks about this report...."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            required
                                            minLength="10"
                                        ></textarea>
                                    </div>
                                    <button onClick={handleSaveComment} className='save-btn'>
                                        Save
                                    </button>
                                </div>
                                <div className="additional-img">
                                    
                                        {imagePreview ? (
                                            // Show uploaded image (either new or existing)
                                            <div className="image-present">
                                                <img
                                                    src={imagePreview}
                                                    alt={selectedImage ? "Uploaded report" : "Existing comment image"}
                                                    className="report-image"
                                                    height="100%"
                                                />
                                                <img
                                                    src="/images/update.svg"
                                                    alt="update Icon"
                                                    className="update-icon"
                                                    width="35px"
                                                    height="35px"
                                                    onClick={toggleModal}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="remove-image-btn"
                                                    title={selectedImage ? "Remove new image" : "Remove current image"}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        background: 'red',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '30px',
                                                        height: '30px',
                                                        cursor: 'pointer',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            // Show upload interface
                                            <div className="img-add-container">
                                                <img
                                                    src="/images/imageupload 1.svg"
                                                    alt="Add Image Icon"
                                                    className="add-image-icon"
                                                    width="130px"
                                                />
                                                <p className="add-image-text">Image of fault (optional)</p>
                                                <div className="line-divider"></div>
                                                <div className="image-btn-container">
                                                    <label htmlFor="directFileInput" className="image-input">
                                                        <img
                                                            src="/images/Plus.svg"
                                                            alt="Upload Icon"
                                                            className="upload-icon"
                                                            width="15px"
                                                            height="15px"
                                                        />
                                                        Upload
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="directFileInput"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        style={{ display: "none" }}
                                                    />
                                                    <label htmlFor="directCameraInput" className="image-input">
                                                        Use Camera
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="directCameraInput"
                                                        accept="image/*"
                                                        capture="environment"
                                                        onChange={handleImageUpload}
                                                        style={{ display: "none" }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                   
                                </div>
                                <div className="spacer" />
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Image Upload Modal */}
            <ImageUploadModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                onImageUpload={handleImageUploadWithModal}
            />
            
            {/* AI Chat Bot */}
            <AIChatBot 
                isOpen={isAIChatOpen}
                onClose={() => setIsAIChatOpen(false)}
                reportData={{
                    ...report,
                    // Add task-specific information
                    taskId: task?._id,
                    taskStatus: task?.status,
                    assignedAdmin: task?.assignedTo?.username || 'Current Admin',
                    taskCreatedAt: task?.createdAt,
                    taskNotes: task?.notes,
                    // Include comments from report
                    comments: report?.comments,
                    // Context indicator
                    contextType: 'admin-task-management'
                }}
            />
            
            {/* Floating AI Chat Button */}
            <button 
                className="ai-chat-icon-button"
                onClick={() => setIsAIChatOpen(true)}
                title="Open AI Assistant"
            >
                <img 
                    src="/images/Chat Icon.svg" 
                    alt="AI Chat" 
                    width="24" 
                    height="24" 
                />
            </button>
        </div>
    );
};
export default IndiTask;