/**
 * Cloudinary Upload Middleware
 * Permanent cloud storage solution for images
 * 
 * This replaces local file storage with Cloudinary cloud storage
 * Images are stored permanently and accessible via CDN
 */

const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// File filter - same as original upload.js
const fileFilter = (req, file, cb) => {
  const isDriverUpload = req.originalUrl?.includes('/drivers');
  
  if (isDriverUpload) {
    const isProfilePicture = file.fieldname === 'profilePicture';
    const isDocument = file.fieldname === 'document' || 
                      file.fieldname === 'licenseDocument' || 
                      file.fieldname === 'insuranceDocument' || 
                      file.fieldname === 'registrationDocument';
    
    if (isProfilePicture) {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile pictures (jpeg, jpg, png, gif, webp)'));
      }
    } else if (isDocument) {
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

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;
let upload;

if (isCloudinaryConfigured) {
  // Use Cloudinary storage
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      // Determine folder based on route
      let folder = 'tribelink/experiences';
      if (req.originalUrl?.includes('/hotels')) {
        folder = 'tribelink/hotels';
      } else if (req.originalUrl?.includes('/drivers')) {
        folder = 'tribelink/drivers';
      }

      // Generate unique public_id
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const publicId = `${folder}/${uniqueSuffix}`;

      return {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto', // Automatically detect image/video
        format: 'webp', // Convert to WebP for better compression
        quality: 'auto:good', // Automatic quality optimization
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Max dimensions
          { quality: 'auto:good' }
        ]
      };
    },
  });

  upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
  });

  console.log('✅ Using Cloudinary for image storage');
} else {
  // Fallback to local storage if Cloudinary not configured
  const fs = require('fs');
  
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const multer = require('multer');
  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      let prefix = 'experience';
      if (req.originalUrl?.includes('/hotels')) {
        prefix = 'hotel';
      } else if (req.originalUrl?.includes('/drivers')) {
        prefix = 'driver';
      }
      cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  upload = multer({
    storage: localStorage,
    limits: {
      fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
  });

  console.log('⚠️  Cloudinary not configured - using local storage (images may be lost on server restart)');
}

module.exports = upload;

