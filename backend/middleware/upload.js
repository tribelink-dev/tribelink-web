const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Determine prefix based on field name or route
    let prefix = 'experience';
    if (req.originalUrl?.includes('/hotels')) {
      prefix = 'hotel';
    } else if (req.originalUrl?.includes('/drivers')) {
      prefix = 'driver';
    }
    cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - allow images and documents
const fileFilter = (req, file, cb) => {
  // Check if this is a driver-related upload
  const isDriverUpload = req.originalUrl?.includes('/drivers');
  
  if (isDriverUpload) {
    // For driver uploads, check the field name
    const isProfilePicture = file.fieldname === 'profilePicture';
    const isDocument = file.fieldname === 'document' || 
                      file.fieldname === 'licenseDocument' || 
                      file.fieldname === 'insuranceDocument' || 
                      file.fieldname === 'registrationDocument';
    
    if (isProfilePicture) {
      // Profile pictures: only images
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile pictures (jpeg, jpg, png, gif, webp)'));
      }
    } else if (isDocument) {
      // Documents: allow images and PDFs
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)|^application\/pdf$/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedMimeTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and PDF files are allowed for documents'));
      }
    } else {
      // Default for driver routes: allow images
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
      }
    }
  } else {
    // For regular uploads (hotels, experiences), only allow images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (increased for documents)
  },
  fileFilter: fileFilter
});

module.exports = upload;

