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
    // For regular uploads (hotels, experiences, abodes), allow images and videos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|mov|avi|mkv|webm|quicktime/;
    const extname = path.extname(file.originalname).toLowerCase();
    const isImage = allowedImageTypes.test(extname) && /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);
    const isVideo = allowedVideoTypes.test(extname) && /^video\/(mp4|quicktime|x-msvideo|x-matroska|webm)$/.test(file.mimetype);

    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and video files (mp4, mov, avi, mkv, webm) are allowed'));
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
  // IMPORTANT: Use minimal params to avoid signature issues
  // multer-storage-cloudinary automatically generates signatures, and adding
  // format/quality/transformation params can cause mismatches
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      // Determine folder based on route
      let folder = 'tribelink/experiences';
      if (req.originalUrl?.includes('/abodes') || req.originalUrl?.includes('/adobes')) {
        folder = 'tribelink/abodes';
      } else if (req.originalUrl?.includes('/hotels')) {
        folder = 'tribelink/hotels';
      } else if (req.originalUrl?.includes('/drivers')) {
        folder = 'tribelink/drivers';
      }

      // Generate unique public_id
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const publicId = `${folder}/${uniqueSuffix}`;

      // Return ONLY essential params - no format, quality, or transformation
      // These cause signature mismatches because multer-storage-cloudinary
      // handles signature generation internally and expects specific param formats
      return {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto' // Automatically detect image/video
        // NOTE: Apply format/quality transformations when SERVING images, not during upload
        // Example: imageUrl + '?f=webp&q=auto:good' when displaying
      };
    },
  });

  upload = multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB limit (for videos)
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
      if (req.originalUrl?.includes('/abodes') || req.originalUrl?.includes('/adobes')) {
        prefix = 'abode';
      } else if (req.originalUrl?.includes('/hotels')) {
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
      fileSize: 100 * 1024 * 1024 // 100MB limit (for videos)
    },
    fileFilter: fileFilter
  });

  console.log('⚠️  Cloudinary not configured - using local storage (images may be lost on server restart)');
}

module.exports = upload;
