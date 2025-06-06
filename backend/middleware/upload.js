const multer = require('multer');
const path = require('path');
const { UPLOAD_PATHS, FILE_SIZE_LIMIT, ALLOWED_FILE_TYPES } = require('../utils/constants');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload path based on file type
    const uploadPath = file.fieldname === 'profilePicture' 
      ? UPLOAD_PATHS.PROFILES 
      : UPLOAD_PATHS.REPORTS;
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG and PNG files are allowed.'), false);
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_SIZE_LIMIT
  },
  fileFilter: fileFilter
});

// Handle profile picture uploads
const uploadProfilePicture = upload.single('profilePicture');

// Handle report image uploads
const uploadReportImage = upload.single('image');

// Handle report fix image uploads
const uploadFixImage = upload.single('fixImage');

// Error handling wrapper
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: `File size should be less than ${FILE_SIZE_LIMIT / (1024 * 1024)}MB` 
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

module.exports = {
  handleUpload,
  uploadProfilePicture,
  uploadReportImage,
  uploadFixImage
};