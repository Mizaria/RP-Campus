import React from 'react';

export const ReportCard = ({ report, onEdit, onDelete }) => {
  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#A7A7A7';
      case 'In Progress':
        return '#E9D674';
      case 'Resolved':
        return '#76BB3F';
      default:
        return '#A7A7A7';
    }
  };

  // Format date to DD/M/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get first 4 digits of report ID
  const getReportIdDisplay = (id) => {
    return `#${id.toString().slice(-4)}`;
  };

  // Check if dropdown should be shown (only for pending status)
  const shouldShowDropdown = report.status === 'Pending';

  return (
    <div className="report-card">
      <div className="report-top-bot">
        <div className="report-top-left">
          <span className="status-circle" style={{ backgroundColor: getStatusColor(report.status) }}></span>
          <p className="report-id">{getReportIdDisplay(report._id)}</p>
        </div>
        {shouldShowDropdown && (
          <div className="main-right">
            <li>
              <img src="images/more vertical.svg" alt="Menu Icon" className="menu-icon" width="22px"
                height="22px" />
              <ul className="dropdown">
                <li onClick={() => onEdit && onEdit(report)}>
                  <img src="images/edit.svg" alt="Edit Icon" className="dropdown-icon" width="22px"
                    height="22px" />Edit
                </li>
                <li onClick={() => onDelete && onDelete(report)}>
                  <img src="images/delete.svg" alt="Delete Icon" className="dropdown-icon" width="22px"
                    height="22px" />Delete
                </li>
              </ul>
            </li>
          </div>
        )}
      </div>
      <div className="report-info-main">
        <p className="report-info-title">{report.category} Problem</p>
        <p className="report-sub-text">{report.description}</p>
      </div>
      <div className="report-info-sub">
        <p className="report-sub-text">
          <span className="light-bold">Assigned to:</span> {
            report.assignedTo && report.assignedTo.username 
              ? report.assignedTo.username 
              : '???'
          }
        </p>
        {report.status === 'Resolved' && (
          <p className="report-sub-text">
            <span className="light-bold">Resolved In:</span> {formatDate(report.updatedAt)}
          </p>
        )}
      </div>
      <div className="report-top-bot">
        <div className="report-location" style={{ backgroundColor: '#EAE0D8' }}>
          <p className="report-sub-text">{report.building}{report.location}{report.room}</p>
        </div>
        <p className="report-date">{formatDate(report.createdAt)}</p>
      </div>
    </div>
  );
}