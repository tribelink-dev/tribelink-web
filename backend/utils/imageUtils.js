/**
 * Image URL normalization utilities
 * Ensures all image URLs are properly formatted for frontend consumption
 */

/**
 * Get the base URL for serving static files
 * In production, this should be the Render backend URL
 */
function getBaseUrl() {
  // In production (Render.com), use the environment variable or construct from request
  if (process.env.NODE_ENV === 'production') {
    // Try to get from environment variable first
    if (process.env.BACKEND_URL) {
      return process.env.BACKEND_URL.replace('/api', '');
    }
    // Fallback: construct from common Render patterns
    // This will be set per-request in middleware
    return process.env.BACKEND_URL || 'https://your-backend.onrender.com';
  }
  
  // Development
  return process.env.BACKEND_URL || 'http://localhost:5000';
}

/**
 * Normalize a single image URL
 * Converts relative paths to full URLs
 * 
 * @param {string} imageUrl - The image URL (can be relative or full)
 * @param {string} baseUrl - Optional base URL (defaults to getBaseUrl())
 * @returns {string|null} - Normalized URL or null if invalid
 */
function normalizeImageUrl(imageUrl, baseUrl = null) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }
  
  // Already a full URL - return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Handle relative paths
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const base = baseUrl || getBaseUrl();
  
  // Remove double slashes but preserve protocol double slash
  const finalUrl = `${base}${cleanUrl}`.replace(/([^:]\/)\/+/g, '$1');
  
  // Debug logging (always log to help diagnose issues)
  console.log('[Image Normalization]', {
    original: imageUrl,
    base: base,
    normalized: finalUrl,
    environment: process.env.NODE_ENV
  });
  
  return finalUrl;
}

/**
 * Normalize experience image URL
 * Experiences store imageUrl as a string
 * 
 * @param {string} imageUrl - The experience image URL
 * @param {string} baseUrl - Optional base URL
 * @returns {string|null} - Normalized URL
 */
function normalizeExperienceImage(imageUrl, baseUrl = null) {
  return normalizeImageUrl(imageUrl, baseUrl);
}

/**
 * Normalize hotel images
 * Hotels store images as an array of objects: [{url: string, isMain: boolean}]
 * 
 * @param {Array} images - Array of image objects
 * @param {string} baseUrl - Optional base URL
 * @returns {Array} - Array of normalized image objects
 */
function normalizeHotelImages(images, baseUrl = null) {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  
  return images.map(img => {
    // Handle both object format and string format
    if (typeof img === 'string') {
      return {
        url: normalizeImageUrl(img, baseUrl),
        isMain: false
      };
    }
    
    if (typeof img === 'object' && img !== null) {
      return {
        url: normalizeImageUrl(img.url, baseUrl),
        isMain: img.isMain || false
      };
    }
    
    return null;
  }).filter(img => img !== null && img.url !== null);
}

/**
 * Normalize experience object - adds normalized imageUrl
 * 
 * @param {Object} experience - Experience object
 * @param {string} baseUrl - Optional base URL
 * @returns {Object} - Experience with normalized imageUrl
 */
function normalizeExperience(experience, baseUrl = null) {
  if (!experience) return experience;
  
  try {
    const normalized = { ...experience };
    
    // Normalize imageUrl if it exists
    if (experience.imageUrl) {
      try {
        normalized.imageUrl = normalizeExperienceImage(experience.imageUrl, baseUrl);
      } catch (imgError) {
        console.error('[normalizeExperience] Error normalizing imageUrl:', imgError);
        // Keep original imageUrl if normalization fails
        normalized.imageUrl = experience.imageUrl;
      }
    }
    
    return normalized;
  } catch (error) {
    console.error('[normalizeExperience] Error normalizing experience:', error);
    // Return original experience if normalization fails
    return experience;
  }
}

/**
 * Normalize hotel object - normalizes images array
 * 
 * @param {Object} hotel - Hotel object
 * @param {string} baseUrl - Optional base URL
 * @returns {Object} - Hotel with normalized images
 */
function normalizeHotel(hotel, baseUrl = null) {
  if (!hotel) return hotel;
  
  const normalized = { ...hotel };
  
  // Normalize images array if it exists
  if (hotel.images) {
    normalized.images = normalizeHotelImages(hotel.images, baseUrl);
  }
  
  return normalized;
}

/**
 * Normalize an array of experiences
 * 
 * @param {Array} experiences - Array of experience objects
 * @param {string} baseUrl - Optional base URL
 * @returns {Array} - Array of normalized experiences
 */
function normalizeExperiences(experiences, baseUrl = null) {
  if (!Array.isArray(experiences)) {
    console.warn('[normalizeExperiences] Input is not an array:', typeof experiences);
    return [];
  }
  
  return experiences.map((exp, index) => {
    try {
      return normalizeExperience(exp, baseUrl);
    } catch (error) {
      console.error(`[normalizeExperiences] Error normalizing experience at index ${index}:`, error);
      // Return original experience if normalization fails
      return exp;
    }
  });
}

/**
 * Normalize an array of hotels
 * 
 * @param {Array} hotels - Array of hotel objects
 * @param {string} baseUrl - Optional base URL
 * @returns {Array} - Array of normalized hotels
 */
function normalizeHotels(hotels, baseUrl = null) {
  if (!Array.isArray(hotels)) {
    return [];
  }
  
  return hotels.map(hotel => normalizeHotel(hotel, baseUrl));
}

/**
 * Get base URL from request
 * Useful in middleware to get the actual request URL
 * 
 * @param {Object} req - Express request object
 * @returns {string} - Base URL
 */
function getBaseUrlFromRequest(req) {
  // Always try environment variable first (most reliable)
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace('/api', '').replace(/\/$/, '');
  }
  
  // In production, construct from request
  if (process.env.NODE_ENV === 'production') {
    if (req) {
      // Check for X-Forwarded-Proto header (common in Render.com)
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || req.get('x-forwarded-host');
      
      if (host) {
        // Remove port if it's the default port
        const cleanHost = host.replace(':443', '').replace(':80', '');
        return `${protocol}://${cleanHost}`;
      }
    }
    
    // Last resort fallback
    return 'https://your-backend.onrender.com';
  }
  
  // Development - construct from request or use localhost
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    return `${protocol}://${host}`;
  }
  
  return 'http://localhost:5000';
}

module.exports = {
  normalizeImageUrl,
  normalizeExperienceImage,
  normalizeHotelImages,
  normalizeExperience,
  normalizeHotel,
  normalizeExperiences,
  normalizeHotels,
  getBaseUrlFromRequest,
  getBaseUrl
};


