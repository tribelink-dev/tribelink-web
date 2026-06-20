/**
 * Abode (Local Host) Routes
 * API endpoints for local hosts offering abode stays
 */

const express = require('express');
const path = require('path');
const LocalHost = require('../models/LocalHost');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const { authenticate, requireUser, requireHost } = require('../middleware/auth');
const upload = require('../middleware/uploadCloudinary');
const { getBaseUrlFromRequest } = require('../utils/imageUtils');
const { publicListingLimiter, anonymousListingLimiter } = require('../middleware/rateLimitPublic');
const clientFingerprint = require('../middleware/clientFingerprint');

const publicReadLimiter = [clientFingerprint, anonymousListingLimiter, publicListingLimiter];

const router = express.Router();

/**
 * Public URL to store in DB / return to client (never absolute disk paths).
 * Cloudinary populates secure_url/url; local disk uses filename under /uploads/.
 */
function publicUrlFromMulterFile(file) {
  if (!file) return null;
  if (file.secure_url && /^https:\/\//i.test(String(file.secure_url))) {
    return String(file.secure_url);
  }
  if (file.url && /^https?:\/\//i.test(String(file.url))) {
    return String(file.url);
  }
  if (file.path && /^https?:\/\//i.test(String(file.path))) {
    return String(file.path);
  }
  if (file.filename) {
    return `/uploads/${file.filename}`;
  }
  if (typeof file.path === 'string' && file.path) {
    const base = path.basename(file.path);
    if (base && base !== file.path) {
      return `/uploads/${base}`;
    }
  }
  return null;
}

/** Image URLs allowed on JSON register/update (after POST /upload-photo). */
function isTrustedAbodeImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  if (u.startsWith('/uploads/')) return true;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'res.cloudinary.com' || host.endsWith('.cloudinary.com')) {
      return true;
    }
    const pathname = parsed.pathname || '';
    if (pathname.startsWith('/uploads/')) {
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (process.env.BACKEND_URL) {
        try {
          const backendHost = new URL(process.env.BACKEND_URL).hostname.toLowerCase();
          if (backendHost && host === backendHost) return true;
        } catch {
          /* ignore */
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

// List all local hosts (abodes) with filters
router.get('/', publicReadLimiter, async (req, res) => {
  try {
    const {
      country,
      state,
      district,
      minPrice,
      maxPrice,
      minRating,
      availableFrom,
      availableTo,
      capacity,
      languages,
      page = 1,
      limit: limitQuery,
      sort = 'rating' // rating, price, newest
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limitQuery) || 20), 50);

    // Build query
    const query = {};
    
    // Filter out archived abodes from public listings
    query.isArchived = { $ne: true };
    
    if (country) query['location.country'] = country;
    if (state) query['location.state'] = { $regex: new RegExp(state, 'i') };
    if (district) query['location.district'] = { $regex: new RegExp(district, 'i') };
    if (minPrice || maxPrice) {
      query['pricing.pricePerNight'] = {};
      if (minPrice) query['pricing.pricePerNight'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.pricePerNight'].$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (capacity) query['abodeDetails.capacity'] = { $gte: Number(capacity) };
    if (languages) {
      query.languages = { $in: Array.isArray(languages) ? languages : [languages] };
    }
    
    // Filter by availability dates
    if (availableFrom && availableTo) {
      const fromDate = new Date(availableFrom);
      const toDate = new Date(availableTo);
      
      // This is a simplified check - in production, you'd want more sophisticated availability checking
      query['availability.date'] = {
        $gte: fromDate,
        $lte: toDate
      };
      query['availability.available'] = true;
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price':
        sortOption = { 'pricing.pricePerNight': 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
      default:
        sortOption = { rating: -1, ratingCount: -1 };
    }

    // Execute query with pagination
    const skip = (pageNum - 1) * limitNum;
    const localHosts = await LocalHost.find(query)
      .populate('providerId', 'name email phoneNumber profilePicture rating')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await LocalHost.countDocuments(query);

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedHosts = localHosts.map(host => {
      const hostObj = host.toObject();
      
      // Normalize main images
      if (hostObj.images && hostObj.images.length > 0) {
        hostObj.images = hostObj.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        }));
      }
      
      // Ensure room variants are included and properly formatted
      if (hostObj.roomVariants && hostObj.roomVariants.length > 0) {
        hostObj.roomVariants = hostObj.roomVariants.map((variant) => {
          const normalizedVariant = {
            variantId: variant.variantId || variant._id?.toString(),
            name: variant.name || '',
            description: variant.description || '',
            pricePerNight: Number(variant.pricePerNight) || 0,
            capacity: Number(variant.capacity) || 1,
            bedrooms: Number(variant.bedrooms) || 1,
            bathrooms: Number(variant.bathrooms) || 1,
            amenities: Array.isArray(variant.amenities) ? variant.amenities : [],
            images: variant.images ? variant.images.map((img) => ({
              ...img,
              url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
            })) : [],
            availability: Array.isArray(variant.availability) ? variant.availability : []
          };
          return normalizedVariant;
        });
      }
      
      // Ensure defaultVariantId is included
      if (hostObj.defaultVariantId) {
        hostObj.defaultVariantId = hostObj.defaultVariantId;
      }
      
      // Include linkedExperiences count for listing (full details available in detail view)
      if (hostObj.linkedExperiences) {
        hostObj.linkedExperiences = Array.isArray(hostObj.linkedExperiences) 
          ? hostObj.linkedExperiences.map((exp) => ({
              _id: typeof exp === 'string' ? exp : exp._id || exp,
              title: typeof exp === 'object' && exp.title ? exp.title : undefined
            }))
          : [];
      }
      
      return hostObj;
    });

    // Debug: Log room variants in development
    if (process.env.NODE_ENV !== 'production') {
      const hostsWithVariants = normalizedHosts.filter((h) => h.roomVariants && h.roomVariants.length > 0);
      console.log(`[GET /abodes] Returning ${normalizedHosts.length} abodes, ${hostsWithVariants.length} have room variants`);
      if (hostsWithVariants.length > 0) {
        hostsWithVariants.forEach((host) => {
          console.log(`[GET /abodes] Abode ${host._id} has ${host.roomVariants.length} variants:`, 
            host.roomVariants.map((v) => ({ name: v.name, price: v.pricePerNight })));
        });
      }
    }

    res.json({
      success: true,
      localHosts: normalizedHosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching local hosts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// One image at a time → Cloudinary/local (staged abode save avoids huge multipart timeouts)
router.post('/upload-photo', authenticate, requireHost, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const url = publicUrlFromMulterFile(req.file);
    if (!url) {
      console.error('[upload-photo] Could not resolve URL; file keys:', Object.keys(req.file));
      return res.status(500).json({ message: 'Upload did not return a usable URL' });
    }
    return res.json({ success: true, url });
  } catch (err) {
    console.error('[upload-photo]', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Get abode details by ID
router.get('/:id', publicReadLimiter, async (req, res) => {
  try {
    const Experience = require('../models/Experience');
    const localHost = await LocalHost.findById(req.params.id)
      .populate('providerId', 'name email phoneNumber profilePicture rating ratingCount');

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Populate linked experiences
    let linkedExperiences = [];
    if (localHost.linkedExperiences && localHost.linkedExperiences.length > 0) {
      linkedExperiences = await Experience.find({
        _id: { $in: localHost.linkedExperiences },
        isArchived: { $ne: true }
      }).populate('provider', 'name rating');
    }

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const hostObj = localHost.toObject();
    if (hostObj.images && hostObj.images.length > 0) {
      hostObj.images = hostObj.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
      }));
    }

    // Normalize variant images
    if (hostObj.roomVariants && hostObj.roomVariants.length > 0) {
      hostObj.roomVariants = hostObj.roomVariants.map(variant => ({
        ...variant,
        images: variant.images ? variant.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        })) : []
      }));
    }

    // Normalize experience images
    const normalizedExperiences = linkedExperiences.map(exp => {
      const expObj = exp.toObject();
      if (expObj.imageUrl && !expObj.imageUrl.startsWith('http')) {
        expObj.imageUrl = `${baseUrl}${expObj.imageUrl}`;
      }
      return expObj;
    });

    res.json({
      success: true,
      localHost: hostObj,
      linkedExperiences: normalizedExperiences
    });
  } catch (error) {
    console.error('Error fetching local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get room variants for an abode
router.get('/:id/variants', async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);
    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    const baseUrl = getBaseUrlFromRequest(req);
    const variants = (localHost.roomVariants || []).map(variant => ({
      ...variant.toObject(),
      images: variant.images ? variant.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
      })) : []
    }));

    res.json({
      success: true,
      variants
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get linked experiences for an abode
router.get('/:id/experiences', async (req, res) => {
  try {
    const Experience = require('../models/Experience');
    const localHost = await LocalHost.findById(req.params.id);
    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    let linkedExperiences = [];
    if (localHost.linkedExperiences && localHost.linkedExperiences.length > 0) {
      linkedExperiences = await Experience.find({
        _id: { $in: localHost.linkedExperiences },
        isArchived: { $ne: true }
      }).populate('provider', 'name rating');
    }

    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedExperiences = linkedExperiences.map(exp => {
      const expObj = exp.toObject();
      if (expObj.imageUrl && !expObj.imageUrl.startsWith('http')) {
        expObj.imageUrl = `${baseUrl}${expObj.imageUrl}`;
      }
      return expObj;
    });

    res.json({
      success: true,
      experiences: normalizedExperiences
    });
  } catch (error) {
    console.error('Error fetching linked experiences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/** JSON body after client uploaded each photo via POST /upload-photo (fast, small requests). */
async function registerAbodeJson(req, res) {
  const providerId = req.user._id;
  const existingHost = await LocalHost.findOne({ providerId });
  if (existingHost) {
    return res.status(400).json({ message: 'Local host profile already exists' });
  }

  const {
    abodeDetails,
    culturalPractices = [],
    nearbyPlaces = [],
    availability = [],
    pricing,
    languages = [],
    familyInfo = {},
    location,
    roomVariants,
    defaultVariantId,
    linkedExperiences = [],
    images: imageInputs
  } = req.body || {};

  if (!Array.isArray(imageInputs) || imageInputs.length === 0) {
    return res.status(400).json({ message: 'At least one image is required' });
  }
  const images = [];
  for (let i = 0; i < imageInputs.length; i++) {
    const row = imageInputs[i];
    const url = row && row.url;
    if (!isTrustedAbodeImageUrl(url)) {
      return res.status(400).json({ message: 'Invalid or untrusted image URL' });
    }
    images.push({
      url,
      isMain: i === 0,
      caption: (row && row.caption) || `Photo ${i + 1}`
    });
  }

  if (!abodeDetails?.title || !String(abodeDetails.title).trim()) {
    return res.status(400).json({ message: 'Abode title is required' });
  }
  if (!abodeDetails?.description || !String(abodeDetails.description).trim()) {
    return res.status(400).json({ message: 'Abode description is required' });
  }
  if (!location?.state || !String(location.state).trim()) {
    return res.status(400).json({ message: 'State is required' });
  }
  if (!location?.district || !String(location.district).trim()) {
    return res.status(400).json({ message: 'District is required' });
  }

  const preparedRoomVariants = Array.isArray(roomVariants) ? roomVariants.map(variant => ({
    variantId: variant.variantId || `variant-${Date.now()}-${Math.random()}`,
    name: variant.name || '',
    description: variant.description || '',
    pricePerNight: Number(variant.pricePerNight) || 0,
    capacity: Number(variant.capacity) || 1,
    bedrooms: Number(variant.bedrooms) || 1,
    bathrooms: Number(variant.bathrooms) || 1,
    amenities: Array.isArray(variant.amenities) ? variant.amenities : [],
    images: Array.isArray(variant.images) ? variant.images : [],
    availability: Array.isArray(variant.availability) ? variant.availability : []
  })) : [];

  const localHost = new LocalHost({
    providerId,
    abodeDetails: {
      title: abodeDetails.title.trim(),
      description: abodeDetails.description || '',
      capacity: Number(abodeDetails.capacity) || 2,
      bedrooms: Number(abodeDetails.bedrooms) || 1,
      bathrooms: Number(abodeDetails.bathrooms) || 1,
      amenities: Array.isArray(abodeDetails.amenities) ? abodeDetails.amenities : [],
      houseRules: Array.isArray(abodeDetails.houseRules) ? abodeDetails.houseRules : [],
      propertyType: abodeDetails.propertyType || 'Traditional Home'
    },
    culturalPractices: Array.isArray(culturalPractices) ? culturalPractices : [],
    nearbyPlaces: Array.isArray(nearbyPlaces) ? nearbyPlaces : [],
    availability: Array.isArray(availability) ? availability : [],
    pricing: {
      pricePerNight: Number(pricing?.pricePerNight) || 0,
      currency: pricing?.currency || 'INR',
      weeklyDiscount: Number(pricing?.weeklyDiscount) || 0,
      monthlyDiscount: Number(pricing?.monthlyDiscount) || 0
    },
    images,
    languages: Array.isArray(languages) ? languages : [],
    familyInfo: familyInfo || {},
    location: {
      country: location?.country || 'India',
      state: location.state || '',
      district: location.district || '',
      address: location?.address || '',
      coordinates: {
        lat: Number(location?.coordinates?.lat) || 0,
        lng: Number(location?.coordinates?.lng) || 0
      },
      nearbyLandmarks: Array.isArray(location?.nearbyLandmarks) ? location.nearbyLandmarks : []
    },
    roomVariants: preparedRoomVariants,
    defaultVariantId: defaultVariantId || (preparedRoomVariants.length > 0 ? preparedRoomVariants[0].variantId : null),
    linkedExperiences: Array.isArray(linkedExperiences) ? linkedExperiences : []
  });

  await localHost.save();
  return res.status(201).json({
    success: true,
    message: 'Local host profile created successfully',
    localHost
  });
}

// Register as local host (create LocalHost profile)
router.post(
  '/register',
  authenticate,
  requireHost,
  (req, res, next) => {
    if (req.is('application/json')) {
      registerAbodeJson(req, res).catch((err) => {
        console.error('Error creating local host (JSON):', err);
        res.status(500).json({ message: 'Server error', error: err.message });
      });
      return;
    }
    next();
  },
  upload.array('images'),
  async (req, res) => {
  try {
    const providerId = req.user._id; // Assuming req.user is the Provider

    // Note: Any authenticated host can now register abodes, regardless of provider type

    // Check if LocalHost profile already exists
    const existingHost = await LocalHost.findOne({ providerId });
    if (existingHost) {
      return res.status(400).json({ message: 'Local host profile already exists' });
    }

    // Parse JSON strings from FormData (multipart/form-data sends JSON as strings)
    let abodeDetails, culturalPractices, nearbyPlaces, availability, pricing, languages, familyInfo, location, roomVariants, defaultVariantId, linkedExperiences;
    
    try {
      abodeDetails = typeof req.body.abodeDetails === 'string' 
        ? JSON.parse(req.body.abodeDetails) 
        : req.body.abodeDetails;
      
      culturalPractices = typeof req.body.culturalPractices === 'string'
        ? JSON.parse(req.body.culturalPractices)
        : req.body.culturalPractices;
      
      nearbyPlaces = typeof req.body.nearbyPlaces === 'string'
        ? JSON.parse(req.body.nearbyPlaces)
        : req.body.nearbyPlaces;
      
      availability = typeof req.body.availability === 'string'
        ? JSON.parse(req.body.availability)
        : req.body.availability;
      
      pricing = typeof req.body.pricing === 'string'
        ? JSON.parse(req.body.pricing)
        : req.body.pricing;
      
      languages = typeof req.body.languages === 'string'
        ? JSON.parse(req.body.languages)
        : req.body.languages;
      
      familyInfo = typeof req.body.familyInfo === 'string'
        ? JSON.parse(req.body.familyInfo)
        : req.body.familyInfo;
      
      location = typeof req.body.location === 'string'
        ? JSON.parse(req.body.location)
        : req.body.location;
      
      if (req.body.roomVariants) {
        roomVariants = typeof req.body.roomVariants === 'string'
          ? JSON.parse(req.body.roomVariants)
          : req.body.roomVariants;
      }
      
      if (req.body.defaultVariantId !== undefined) {
        defaultVariantId = typeof req.body.defaultVariantId === 'string' && req.body.defaultVariantId.startsWith('{')
          ? JSON.parse(req.body.defaultVariantId)
          : req.body.defaultVariantId;
      }
      
      if (req.body.linkedExperiences) {
        linkedExperiences = typeof req.body.linkedExperiences === 'string'
          ? JSON.parse(req.body.linkedExperiences)
          : req.body.linkedExperiences;
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      return res.status(400).json({ 
        message: 'Invalid JSON data in form fields',
        error: parseError.message 
      });
    }

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: file.path || file.url,
          isMain: index === 0,
          caption: file.originalname
        });
      });
    }
    if (images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Validate required fields
    if (!abodeDetails?.title || !abodeDetails.title.trim()) {
      return res.status(400).json({ message: 'Abode title is required' });
    }
    if (!abodeDetails?.description || !abodeDetails.description.trim()) {
      return res.status(400).json({ message: 'Abode description is required' });
    }
    if (!location?.state || !location.state.trim()) {
      return res.status(400).json({ message: 'State is required' });
    }
    if (!location?.district || !location.district.trim()) {
      return res.status(400).json({ message: 'District is required' });
    }

    // Prepare room variants with proper structure
    const preparedRoomVariants = Array.isArray(roomVariants) ? roomVariants.map(variant => ({
      variantId: variant.variantId || `variant-${Date.now()}-${Math.random()}`,
      name: variant.name || '',
      description: variant.description || '',
      pricePerNight: Number(variant.pricePerNight) || 0,
      capacity: Number(variant.capacity) || 1,
      bedrooms: Number(variant.bedrooms) || 1,
      bathrooms: Number(variant.bathrooms) || 1,
      amenities: Array.isArray(variant.amenities) ? variant.amenities : [],
      images: Array.isArray(variant.images) ? variant.images : [],
      availability: Array.isArray(variant.availability) ? variant.availability : []
    })) : [];

    const localHost = new LocalHost({
      providerId,
      abodeDetails: {
        title: abodeDetails.title.trim(),
        description: abodeDetails.description || '',
        capacity: Number(abodeDetails.capacity) || 2,
        bedrooms: Number(abodeDetails.bedrooms) || 1,
        bathrooms: Number(abodeDetails.bathrooms) || 1,
        amenities: Array.isArray(abodeDetails.amenities) ? abodeDetails.amenities : [],
        houseRules: Array.isArray(abodeDetails.houseRules) ? abodeDetails.houseRules : [],
        propertyType: abodeDetails.propertyType || 'Traditional Home'
      },
      culturalPractices: Array.isArray(culturalPractices) ? culturalPractices : [],
      nearbyPlaces: Array.isArray(nearbyPlaces) ? nearbyPlaces : [],
      availability: Array.isArray(availability) ? availability : [],
      pricing: {
        pricePerNight: Number(pricing?.pricePerNight) || 0,
        currency: pricing?.currency || 'INR',
        weeklyDiscount: Number(pricing?.weeklyDiscount) || 0,
        monthlyDiscount: Number(pricing?.monthlyDiscount) || 0
      },
      images,
      languages: Array.isArray(languages) ? languages : [],
      familyInfo: familyInfo || {},
      location: {
        country: location?.country || 'India',
        state: location.state || '',
        district: location.district || '',
        address: location?.address || '',
        coordinates: {
          lat: Number(location?.coordinates?.lat) || 0,
          lng: Number(location?.coordinates?.lng) || 0
        },
        nearbyLandmarks: Array.isArray(location?.nearbyLandmarks) ? location.nearbyLandmarks : []
      },
      roomVariants: preparedRoomVariants,
      defaultVariantId: defaultVariantId || (preparedRoomVariants.length > 0 ? preparedRoomVariants[0].variantId : null),
      linkedExperiences: Array.isArray(linkedExperiences) ? linkedExperiences : []
    });

    console.log('[Register Abode] Room variants being saved:', JSON.stringify(preparedRoomVariants, null, 2));
    console.log('[Register Abode] Linked experiences being saved:', linkedExperiences);

    await localHost.save();
    
    console.log('[Register Abode] Abode saved with ID:', localHost._id);
    console.log('[Register Abode] Saved room variants count:', localHost.roomVariants?.length || 0);

    res.status(201).json({
      success: true,
      message: 'Local host profile created successfully',
      localHost
    });
  } catch (error) {
    console.error('Error creating local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  }
);

// Update local host profile
async function updateAbodeJson(req, res) {
  const localHost = await LocalHost.findById(req.params.id);
  if (!localHost) {
    return res.status(404).json({ message: 'Local host not found' });
  }
  if (localHost.providerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const body = req.body || {};
  const {
    abodeDetails,
    culturalPractices,
    nearbyPlaces,
    availability,
    pricing,
    languages,
    familyInfo,
    location,
    roomVariants,
    defaultVariantId,
    linkedExperiences,
    existingImages: existingImagesData,
    newUploadedImages = []
  } = body;

  if (abodeDetails) localHost.abodeDetails = { ...localHost.abodeDetails, ...abodeDetails };
  if (culturalPractices !== undefined) {
    localHost.culturalPractices = Array.isArray(culturalPractices) ? culturalPractices : localHost.culturalPractices;
  }
  if (nearbyPlaces !== undefined) {
    localHost.nearbyPlaces = Array.isArray(nearbyPlaces) ? nearbyPlaces : localHost.nearbyPlaces;
  }
  if (availability !== undefined) {
    localHost.availability = Array.isArray(availability) ? availability : localHost.availability;
  }
  if (pricing) localHost.pricing = { ...localHost.pricing, ...pricing };
  if (languages !== undefined) {
    localHost.languages = Array.isArray(languages) ? languages : localHost.languages;
  }
  if (familyInfo) localHost.familyInfo = { ...localHost.familyInfo, ...familyInfo };
  if (location) localHost.location = { ...localHost.location, ...location };
  if (roomVariants !== undefined && Array.isArray(roomVariants)) {
    localHost.roomVariants = roomVariants;
  }
  if (defaultVariantId !== undefined) {
    localHost.defaultVariantId = defaultVariantId || null;
  }
  if (linkedExperiences !== undefined && Array.isArray(linkedExperiences)) {
    localHost.linkedExperiences = linkedExperiences;
  }

  let existingImagesToKeep = [];
  if (Array.isArray(existingImagesData)) {
    const existingImageIds = existingImagesData.map(img => img._id?.toString()).filter(Boolean);
    existingImagesToKeep = localHost.images.filter(img =>
      existingImageIds.includes(img._id.toString())
    );
    const orderedImages = [];
    existingImagesData.forEach(requestedImg => {
      const found = existingImagesToKeep.find(img => img._id.toString() === requestedImg._id?.toString());
      if (found) {
        if (requestedImg.isMain !== undefined) found.isMain = requestedImg.isMain;
        if (requestedImg.caption !== undefined) found.caption = requestedImg.caption;
        orderedImages.push(found);
      }
    });
    existingImagesToKeep = orderedImages;
  } else {
    existingImagesToKeep = localHost.images;
  }

  const newImages = [];
  if (Array.isArray(newUploadedImages)) {
    for (let i = 0; i < newUploadedImages.length; i++) {
      const row = newUploadedImages[i];
      const url = row && row.url;
      if (!isTrustedAbodeImageUrl(url)) {
        return res.status(400).json({ message: 'Invalid or untrusted image URL' });
      }
      newImages.push({
        url,
        isMain: existingImagesToKeep.length === 0 && i === 0,
        caption: (row && row.caption) || `Photo ${i + 1}`
      });
    }
  }

  const allImages = [...existingImagesToKeep, ...newImages];
  if (allImages.length > 0) {
    allImages.forEach((img, idx) => {
      img.isMain = idx === 0;
    });
  }
  localHost.images = allImages;

  await localHost.save();
  return res.json({
    success: true,
    message: 'Local host profile updated successfully',
    localHost
  });
}

router.put(
  '/:id',
  authenticate,
  requireHost,
  (req, res, next) => {
    if (req.is('application/json')) {
      updateAbodeJson(req, res).catch((err) => {
        console.error('Error updating local host (JSON):', err);
        res.status(500).json({ message: 'Server error', error: err.message });
      });
      return;
    }
    next();
  },
  upload.array('images'),
  async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Parse JSON strings from FormData (multipart/form-data sends JSON as strings)
    let abodeDetails, culturalPractices, nearbyPlaces, availability, pricing, languages, familyInfo, location, roomVariants, defaultVariantId, linkedExperiences;
    
    try {
      if (req.body.abodeDetails) {
        abodeDetails = typeof req.body.abodeDetails === 'string' 
          ? JSON.parse(req.body.abodeDetails) 
          : req.body.abodeDetails;
      }
      
      if (req.body.culturalPractices) {
        culturalPractices = typeof req.body.culturalPractices === 'string'
          ? JSON.parse(req.body.culturalPractices)
          : req.body.culturalPractices;
      }
      
      if (req.body.nearbyPlaces) {
        nearbyPlaces = typeof req.body.nearbyPlaces === 'string'
          ? JSON.parse(req.body.nearbyPlaces)
          : req.body.nearbyPlaces;
      }
      
      if (req.body.availability) {
        availability = typeof req.body.availability === 'string'
          ? JSON.parse(req.body.availability)
          : req.body.availability;
      }
      
      if (req.body.pricing) {
        pricing = typeof req.body.pricing === 'string'
          ? JSON.parse(req.body.pricing)
          : req.body.pricing;
      }
      
      if (req.body.languages) {
        languages = typeof req.body.languages === 'string'
          ? JSON.parse(req.body.languages)
          : req.body.languages;
      }
      
      if (req.body.familyInfo) {
        familyInfo = typeof req.body.familyInfo === 'string'
          ? JSON.parse(req.body.familyInfo)
          : req.body.familyInfo;
      }
      
      if (req.body.location) {
        location = typeof req.body.location === 'string'
          ? JSON.parse(req.body.location)
          : req.body.location;
      }
      
      if (req.body.roomVariants) {
        roomVariants = typeof req.body.roomVariants === 'string'
          ? JSON.parse(req.body.roomVariants)
          : req.body.roomVariants;
      }
      
      if (req.body.defaultVariantId !== undefined) {
        defaultVariantId = typeof req.body.defaultVariantId === 'string' && req.body.defaultVariantId.startsWith('{')
          ? JSON.parse(req.body.defaultVariantId)
          : req.body.defaultVariantId;
      }
      
      if (req.body.linkedExperiences) {
        linkedExperiences = typeof req.body.linkedExperiences === 'string'
          ? JSON.parse(req.body.linkedExperiences)
          : req.body.linkedExperiences;
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      return res.status(400).json({ 
        message: 'Invalid JSON data in form fields',
        error: parseError.message 
      });
    }

    // Update fields
    if (abodeDetails) localHost.abodeDetails = { ...localHost.abodeDetails, ...abodeDetails };
    if (culturalPractices) localHost.culturalPractices = Array.isArray(culturalPractices) ? culturalPractices : localHost.culturalPractices;
    if (nearbyPlaces) localHost.nearbyPlaces = Array.isArray(nearbyPlaces) ? nearbyPlaces : localHost.nearbyPlaces;
    if (availability) localHost.availability = Array.isArray(availability) ? availability : localHost.availability;
    if (pricing) localHost.pricing = { ...localHost.pricing, ...pricing };
    if (languages) localHost.languages = Array.isArray(languages) ? languages : localHost.languages;
    if (familyInfo) localHost.familyInfo = { ...localHost.familyInfo, ...familyInfo };
    if (location) localHost.location = { ...localHost.location, ...location };
    
    // Update room variants if provided
    if (roomVariants !== undefined) {
      if (Array.isArray(roomVariants)) {
        localHost.roomVariants = roomVariants;
      }
    }
    
    // Update default variant ID if provided
    if (defaultVariantId !== undefined) {
      localHost.defaultVariantId = defaultVariantId || null;
    }
    
    // Update linked experiences if provided
    if (linkedExperiences !== undefined) {
      if (Array.isArray(linkedExperiences)) {
        localHost.linkedExperiences = linkedExperiences;
      }
    }

    // Handle images: keep existing ones that weren't removed, and add new ones
    let existingImagesToKeep = [];
    if (req.body.existingImages) {
      try {
        const existingImagesData = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        
        // Map to preserve existing image structure with IDs
        // Find matching images from the database to preserve their MongoDB structure
        const existingImageIds = existingImagesData.map(img => img._id?.toString()).filter(Boolean);
        existingImagesToKeep = localHost.images.filter(img => 
          existingImageIds.includes(img._id.toString())
        );
        
        // Preserve order from the request
        const orderedImages = [];
        existingImagesData.forEach(requestedImg => {
          const found = existingImagesToKeep.find(img => img._id.toString() === requestedImg._id?.toString());
          if (found) {
            // Update properties if changed
            if (requestedImg.isMain !== undefined) found.isMain = requestedImg.isMain;
            if (requestedImg.caption !== undefined) found.caption = requestedImg.caption;
            orderedImages.push(found);
          }
        });
        existingImagesToKeep = orderedImages;
      } catch (parseError) {
        console.error('Error parsing existingImages:', parseError);
        // If parsing fails, keep all existing images
        existingImagesToKeep = localHost.images;
      }
    } else {
      // If no existingImages sent, keep all current images
      existingImagesToKeep = localHost.images;
    }

    // Prepare new images from uploads
    const newImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        newImages.push({
        url: file.path || file.url,
          isMain: existingImagesToKeep.length === 0 && index === 0,
          caption: file.originalname || file.filename
        });
      });
    }

    // Combine: existing images (that weren't removed) + new images
    // Set first image as main if there are images
    const allImages = [...existingImagesToKeep, ...newImages];
    if (allImages.length > 0) {
      // Ensure only first image is main
      allImages.forEach((img, idx) => {
        img.isMain = idx === 0;
      });
    }

    localHost.images = allImages;

    await localHost.save();

    res.json({
      success: true,
      message: 'Local host profile updated successfully',
      localHost
    });
  } catch (error) {
    console.error('Error updating local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  }
);

// Get abodes by owner (for abode host dashboard)
router.get('/owner/my-abodes', authenticate, requireHost, async (req, res) => {
  try {
    // Any authenticated host can now access their abodes, regardless of provider type
    const abodes = await LocalHost.find({ providerId: req.user._id })
      .populate('providerId', 'name email phoneNumber profilePicture rating ratingCount')
      .sort({ createdAt: -1 });

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedAbodes = abodes.map(abode => {
      const abodeObj = abode.toObject();
      if (abodeObj.images && abodeObj.images.length > 0) {
        abodeObj.images = abodeObj.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        }));
      }
      return abodeObj;
    });

    res.json({
      success: true,
      abodes: normalizedAbodes
    });
  } catch (error) {
    console.error('Error fetching abodes by owner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bookings for a local host
router.get('/:id/bookings', authenticate, requireHost, async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {
      'abodeStay.localHost': req.params.id,
      bookingType: 'ABODE_STAY'
    };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const bookings = await Booking.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('trip')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle archive status for an abode
router.patch('/:id/archive', authenticate, requireHost, async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Toggle archive status
    localHost.isArchived = !localHost.isArchived;
    await localHost.save();

    res.json({
      success: true,
      message: localHost.isArchived ? 'Abode archived successfully' : 'Abode unarchived successfully',
      localHost
    });
  } catch (error) {
    console.error('Error toggling archive status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete local host profile
router.delete('/:id', authenticate, requireHost, async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.countDocuments({
      'abodeStay.localHost': req.params.id,
      bookingType: 'ABODE_STAY',
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete abode with active bookings. Please cancel or complete all bookings first.' 
      });
    }

    await LocalHost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Local host profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


