import React from 'react';

export const ReportCardAdmin = ({ 
  report, 
  onEdit, 
  onDelete, 
  onClick, 
  onAccept, 
  onEscalate, 
  onDeEscalate,
  isSubmitting = false 
}) => {
  // Validate report prop
  if (!report) {
    return null;
  }

  // Priority color mapping (changed from status to priority)
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

  // Get first 4 digits of report ID
  const getReportIdDisplay = (id) => {
    if (!id) return '#0000';
    return `#${id.toString().slice(-4)}`;
  };

  // Get building background color
  const getBuildingColor = (building) => {
    if (!building) return '#E0E0E0';
    
    const buildingCode = building.toUpperCase();
    
    switch (buildingCode) {
            case 'E4':
            case 'E3':
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
            case 'E5':
                return '#F1EFCD';
            case 'W4':
                return '#EAE5CB';
            case 'W6':
                return '#EAE0D8';
            default:
                return '#E0E0E0';
        }
  };



  // Dropdown should always show (removed condition)
  const shouldShowDropdown = true;

  // Handle card click
  const handleCardClick = (e) => {
    // Prevent click if clicking on dropdown or its children
    if (e.target.closest('.main-right') || e.target.closest('.Accept-btn')) {
      return;
    }
    // Call the onClick prop if provided
    if (onClick) {
      onClick(report);
    }
  };

  // Handle accept button click
  const handleAcceptClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onAccept) {
      onAccept(report);
    }
  };

  // Handle escalate click
  const handleEscalateClick = (e) => {
    e.stopPropagation();
    console.log('Escalate clicked for report:', report._id);
    if (onEscalate) {
      onEscalate(report);
    }
  };

  // Handle de-escalate click
  const handleDeEscalateClick = (e) => {
    e.stopPropagation();
    console.log('De-escalate clicked for report:', report._id);
    if (onDeEscalate) {
      onDeEscalate(report);
    }
  };

  // Handle delete click
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(report);
    }
  };

  return (
    <div className="report-card" onClick={handleCardClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="report-top-bot">
        <div className="report-top-left">
          <span className="status-circle" style={{ backgroundColor: getPriorityColor(report.priority) }}></span>
          <p className="report-id">{getReportIdDisplay(report._id)}</p>
        </div>
        {shouldShowDropdown && (
          <div className="main-right" onClick={(e) => e.stopPropagation()}>
            <li>
              <img src="/images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px"
                height="22px" />
              <ul className="dropdown">
                {report.priority !== 'High' && (
                  <li onClick={handleEscalateClick}>
                    <img src="/images/Up.svg" alt="Escalate Icon" className="dropdown-icon" width="22px"
                      height="22px" />Escalate
                  </li>
                )}
                {report.priority !== 'Low' && (
                  <li onClick={handleDeEscalateClick}>
                    <img src="/images/Down.svg" alt="De-escalate Icon" className="dropdown-icon" width="22px"
                      height="22px" />De-escalate
                  </li>
                )}
                <li onClick={handleDeleteClick}>
                  <img src="/images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px"
                    height="22px" />Delete
                </li>
              </ul>
            </li>
          </div>
        )}
      </div>
      <div className="report-info-main">
        <p className="report-info-title">{report.category || 'Unknown'} Problem</p>
        <p className="report-sub-text">{report.description || 'No description available'}</p>
      </div>
      <div className="report-info-sub">
        <p className="report-sub-text">
          <span className="light-bold">Created on:</span> {formatDate(report.createdAt)}
        </p>
        
        {report.assignedTo && (
          <p className="report-sub-text">
            <span className="light-bold">Assigned to:</span> {
              typeof report.assignedTo === 'object' 
                ? (report.assignedTo.username || report.assignedTo.name || 'Unknown Admin')
                : 'Unknown Admin'
            }
          </p>
        )}
      </div>
      <div className="report-top-bot">
        <div className="report-location" style={{ backgroundColor: getBuildingColor(report.building) }}>
          <p className="report-sub-text">
            {report.building || 'N/A'}{report.location || 'N/A'}{report.room || 'N/A'}
          </p>
        </div>
        <button 
          className={`Accept-btn ${isSubmitting ? 'submitting' : ''}`}
          onClick={handleAcceptClick}
          disabled={report.status !== 'Pending' || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 
           report.status === 'Pending' ? 'Accept' : 'Accepted'}
        </button>
      </div>
    </div>
  );
}