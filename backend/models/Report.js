const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  report_id: {
    type: String,
    unique: true,
    required: true
  },
  building_name: {
    type: String,
    required: [true, 'Building name is required'],
    trim: true,
    maxlength: [100, 'Building name cannot exceed 100 characters']
  },
  floor: {
    type: String,
    required: [true, 'Floor is required'],
    trim: true,
    maxlength: [20, 'Floor cannot exceed 20 characters']
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true,
    maxlength: [50, 'Room cannot exceed 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image_url: {
    type: String,
    default: null // Optional image of the issue
  },
  severity: {
    type: String,
    enum: {
      values: ['Low', 'High'],
      message: 'Severity must be either Low or High'
    },
    default: 'Low'
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'In_Progress', 'Resolved'],
      message: 'Status must be Pending, In_Progress, or Resolved'
    },
    default: 'Pending'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Report creator is required']
  },
  assigned_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assigned_at: {
    type: Date,
    default: null
  },
  resolved_at: {
    type: Date,
    default: null
  },
  resolution_image_url: {
    type: String,
    default: null // Optional fix image uploaded by admin
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    default: null
  },  
  admin_status: {
    type: String,
    enum: {
      values: ['To_Do', 'In_Progress', 'Completed', 'Draft'],
      message: 'Admin status must be To_Do, In_Progress, Completed, or Draft'
    },
    default: null // Only set when admin accepts the report
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
reportSchema.index({ created_by: 1 });
reportSchema.index({ assigned_admin: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ severity: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ report_id: 1 });

// Pre-save middleware to generate report ID
reportSchema.pre('save', async function(next) {
  if (!this.report_id) {
    this.report_id = await this.constructor.generateUniqueReportId();
  }
  next();
});

// Static method to generate unique 4-digit report ID
reportSchema.statics.generateUniqueReportId = async function() {
  let reportId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 4-digit number (1000-9999)
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    reportId = randomNum.toString();
    
    // Check if this ID already exists
    const existingReport = await this.findOne({ report_id: reportId });
    if (!existingReport) {
      isUnique = true;
    }
  }
    return reportId;
};

// Check if report can be edited (only Pending status)
reportSchema.methods.canBeEdited = function() {
  return this.status === 'Pending';
};

// Check if report can be deleted (only Pending status)
reportSchema.methods.canBeDeleted = function() {
  return this.status === 'Pending';
};

module.exports = mongoose.model('Report', reportSchema);