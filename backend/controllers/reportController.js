const Report = require('../models/Report');

// CREATE: Student/Staff create new report
const createReport = async (req, res) => {
  try {
    const { building_name, floor, room, category, description, image_url } = req.body;

    if (!building_name || !floor || !room || !category || !description) {
      return res.status(400).json({ message: 'All fields required except image' });
    }

    const report = new Report({
      building_name,
      floor,
      room,
      category,
      description,
      image_url,
      created_by: req.user._id
    });

    await report.save();
    await report.populate('created_by', 'first_name last_name email');

    res.status(201).json({ message: 'Report created successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ: Get all reports for admin dashboard
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('created_by', 'first_name last_name email')
      .populate('assigned_admin', 'first_name last_name email')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ: Get user's active reports (Pending + In_Progress)
const getMyActiveReports = async (req, res) => {
  try {
    const reports = await Report.find({ 
      created_by: req.user._id,
      status: { $in: ['Pending', 'In_Progress'] }
    })
      .populate('assigned_admin', 'first_name last_name email')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ: Get user's resolved reports
const getMyResolvedReports = async (req, res) => {
  try {
    const reports = await Report.find({ 
      created_by: req.user._id,
      status: 'Resolved'
    })
      .populate('assigned_admin', 'first_name last_name email')
      .sort({ resolved_at: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ: Get single report by ID
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('created_by', 'first_name last_name email')
      .populate('assigned_admin', 'first_name last_name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can view this report
    const isOwner = report.created_by._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssigned = report.assigned_admin && report.assigned_admin._id.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE: Student/Staff update their pending reports
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check ownership and status
    if (report.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }    // Check if report can be edited (only Pending status)
    if (!report.canBeEdited()) {
      return res.status(400).json({ message: 'Can only edit pending reports' });
    }

    const { building_name, floor, room, category, description, image_url } = req.body;

    // Update fields
    if (building_name) report.building_name = building_name;
    if (floor) report.floor = floor;
    if (room) report.room = room;
    if (category) report.category = category;
    if (description) report.description = description;
    if (image_url !== undefined) report.image_url = image_url;

    await report.save();
    await report.populate('created_by', 'first_name last_name email');

    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE: Student/Staff delete their pending reports
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check ownership and status
    if (report.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }    // Check if report can be deleted (only Pending status)
    if (!report.canBeDeleted()) {
      return res.status(400).json({ message: 'Can only delete pending reports' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Update report severity
const updateSeverity = async (req, res) => {
  try {
    const { severity } = req.body;

    if (!['Low', 'High'].includes(severity)) {
      return res.status(400).json({ message: 'Severity must be Low or High' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { severity },
      { new: true }
    ).populate('created_by', 'first_name last_name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Severity updated successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Accept report (assign to admin)
const acceptReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending reports can be accepted' });
    }

    // Assign to admin and update statuses
    report.assigned_admin = req.user._id;
    report.assigned_at = new Date();
    report.status = 'In_Progress';
    report.admin_status = 'To_Do';

    await report.save();
    await report.populate('created_by', 'first_name last_name email');
    await report.populate('assigned_admin', 'first_name last_name email');

    res.json({ message: 'Report accepted successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Update admin status and add remarks/resolution image
const updateAdminStatus = async (req, res) => {
  try {
    const { admin_status, remarks, resolution_image_url } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user is assigned admin
    if (!report.assigned_admin || report.assigned_admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied - not assigned to you' });
    }

    // Update admin status
    if (admin_status && ['To_Do', 'In_Progress', 'Draft', 'Completed'].includes(admin_status)) {
      report.admin_status = admin_status;
    }

    // Update remarks and resolution image
    if (remarks !== undefined) report.remarks = remarks;
    if (resolution_image_url !== undefined) report.resolution_image_url = resolution_image_url;

    // If completed, mark report as resolved
    if (admin_status === 'Completed') {
      report.status = 'Resolved';
      report.resolved_at = new Date();
    }

    await report.save();
    await report.populate('created_by', 'first_name last_name email');
    await report.populate('assigned_admin', 'first_name last_name email');

    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Get admin's assigned reports history (Draft and Completed)
const getAdminHistory = async (req, res) => {
  try {
    const reports = await Report.find({
      assigned_admin: req.user._id,
      admin_status: { $in: ['Draft', 'Completed'] }
    })
      .populate('created_by', 'first_name last_name email')
      .sort({ updatedAt: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getMyActiveReports,
  getMyResolvedReports,
  getReportById,
  updateReport,
  deleteReport,
  updateSeverity,
  acceptReport,
  updateAdminStatus,
  getAdminHistory
};
