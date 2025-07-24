import React from 'react';

export const TaskCardAdmin = ({ 
  task,
  onTaskClick, 
  onRemoveTask,
  onProgressTask,
  onCompleteTask,
  isSubmitting = false 
}) => {
  // Validate task prop
  if (!task) {
    return null;
  }

  // Get report from task
  const report = task.reportId || {};

  // Status color mapping for admin task status
  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do':
        return '#A7A7A7';
      case 'In Progress':
        return '#E9D674';
      case 'Draft':
        return '#76BB3F';
      case 'Completed':
        return '#76BB3F';
      default:
        return '#A7A7A7';
    }
  };

  // // Priority color mapping (changed from status to priority)
  // const getPriorityColor = (priority) => {
  //   switch (priority) {
  //     case 'High':
  //       return '#E86464';
  //     case 'Medium':
  //       return '#FFA500';
  //     case 'Low':
  //       return '#76BB3F';
  //     default:
  //       return '#A7A7A7';
  //   }
  // };

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

  // Get first 4 digits of task ID
  const getTaskIdDisplay = (id) => {
    if (!id) return '#0000';
    return `#${id.toString().slice(-4)}`;
  };

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
        return '#EAE0D8';
      case 'W4':
        return '#EAE5CB';
      case 'W6':
        return '#EAE0D8';
      default:
        return '#E0E0E0';
    }
  };

  // Handle card click
  const handleCardClick = (e) => {
    // Prevent click if clicking on dropdown or action buttons
    if (e.target.closest('.main-right') || e.target.closest('.status-btn')) {
      return;
    }
    // Call the onClick prop if provided
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  // Handle remove task click
  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (onRemoveTask) {
      onRemoveTask(task);
    }
  };

  // Handle progress task click (right arrow)
  const handleProgressClick = (e) => {
    e.stopPropagation();
    if (onProgressTask) {
      onProgressTask(task);
    }
  };

  // Handle complete task click (done button)
  const handleCompleteClick = (e) => {
    e.stopPropagation();
    if (onCompleteTask) {
      onCompleteTask(task);
    }
  };

  return (
    <div className="report-card" onClick={handleCardClick} style={{ cursor: onTaskClick ? 'pointer' : 'default' }}>
      <div className="report-top-bot">
        <div className="report-top-left">
          <span className="status-circle" style={{ 
            backgroundColor: getStatusColor(task.status),
            boxShadow: task.status === 'Draft' ? 'inset 0 0 0 3px #EFE9AF' : 'none'
          }}></span>
          <p className="report-id">{getTaskIdDisplay(task._id)}</p>
        </div>
        {task.status !== 'Completed' && (
          <div className="main-right" onClick={(e) => e.stopPropagation()}>
            <li>
              <img src="/images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px"
                height="22px" />
              <ul className="dropdown">
                <li onClick={handleRemoveClick}>
                  <img src="/images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px"
                    height="22px" />Remove Task
                </li>
              </ul>
            </li>
          </div>
        )}
      </div>
      <div className="report-info-main">
        <p className="report-info-title" ><span style={{backgroundColor: task.priority === 'High' ? '#F5C4B8' : '', padding: '0px 2px', borderRadius: '4px'}}>{report.category || 'Unknown'} Problem</span></p>
        <p className="report-sub-text">{report.description || 'No description available'}</p>
      </div>
      <div className="report-info-sub">
        <p className="report-sub-text">
          <span className="light-bold">Created on:</span> {formatDate(task.createdAt)}
        </p>
        {task.status === 'Completed' && (
          <p className="report-sub-text">
            <span className="light-bold">Completed In:</span> {formatDate(task.completedAt || task.updatedAt)}
          </p>
        )}
      </div>
      <div className="report-top-bot">
        <div className="report-location" style={{ backgroundColor: getBuildingColor(report.building) }}>
          <p className="report-sub-text">
            {report.building || 'N/A'}, {report.location || 'N/A'}, {report.room || 'N/A'}
          </p>
        </div>
        
        {/* Show right arrow for To Do and In Progress, Done button for Draft */}
        {task.status === 'Draft' ? (
          <button 
            className={`status-btn done-btn ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleCompleteClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Done'}
          </button>
        ) : (task.status === 'To Do' || task.status === 'In Progress') ? (
          <button 
            className={`status-btn progress-btn ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleProgressClick}
            disabled={isSubmitting}
          >
            <img src="/images/Arrow right.svg" alt="Progress Icon" className="status-icon" width={20} height={20}/>
          </button>
        ) : null}
      </div>
    </div>
  );
}