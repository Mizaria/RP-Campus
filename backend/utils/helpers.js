const fs = require('fs').promises;
const path = require('path');

// Delete file helper
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  const dirs = ['uploads/profiles', 'uploads/reports'];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }
};

// Format error response
const formatError = (error) => {
  return {
    message: error.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? null : error.stack
  };
};

// Clean old files
const cleanOldFiles = async (directory, maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await deleteFile(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning old files:', error);
  }
};

module.exports = {
  deleteFile,
  createUploadDirs,
  formatError,
  cleanOldFiles
};