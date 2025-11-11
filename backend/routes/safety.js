const express = require('express');
const User = require('../models/User');
const EmergencyEvent = require('../models/EmergencyEvent');
const EmergencyNumbers = require('../models/EmergencyNumbers');
const { authenticate, requireUser } = require('../middleware/auth');

const router = express.Router();

// Get emergency contacts
router.get('/contacts', authenticate, requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts');
    res.json({ contacts: user.emergencyContacts || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add emergency contact
router.post('/contacts', authenticate, requireUser, async (req, res) => {
  try {
    const { name, phone, email, relationship, isPrimary } = req.body;

    console.log('Add emergency contact request:', { name, phone, email, relationship, isPrimary });

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // First, check if user exists and check if emergencyContacts field exists
    const user = await User.findById(req.user._id).lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create new contact object
    const newContactData = {
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship || 'other',
      isPrimary: Boolean(isPrimary)
    };

    // Only add email if it's provided and not empty
    if (email && typeof email === 'string' && email.trim().length > 0) {
      newContactData.email = email.trim().toLowerCase();
    }

    // If emergencyContacts doesn't exist in the document, initialize it
    if (!user.emergencyContacts) {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { emergencyContacts: [newContactData] } }
      );
    } else {
      // Field exists, use $push
      // If setting as primary, unset other primary contacts first
      if (isPrimary && user.emergencyContacts.length > 0) {
        await User.updateOne(
          { _id: req.user._id },
          { $set: { 'emergencyContacts.$[].isPrimary': false } }
        );
      }
      
      // Push the new contact
      const updateResult = await User.updateOne(
        { _id: req.user._id },
        { $push: { emergencyContacts: newContactData } }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    
    // Reload user to get the new contact with _id
    const updatedUser = await User.findById(req.user._id).select('emergencyContacts');
    const addedContact = updatedUser.emergencyContacts[updatedUser.emergencyContacts.length - 1];

    res.json({ 
      message: 'Emergency contact added successfully',
      contact: {
        _id: addedContact._id.toString(),
        name: addedContact.name,
        phone: addedContact.phone,
        email: addedContact.email || '',
        relationship: addedContact.relationship,
        isPrimary: addedContact.isPrimary
      }
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update emergency contact
router.put('/contacts/:contactId', authenticate, requireUser, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, phone, email, relationship, isPrimary } = req.body;

    const user = await User.findById(req.user._id);
    
    // Initialize emergencyContacts if it doesn't exist
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }
    
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary && user.emergencyContacts.length > 0) {
      user.emergencyContacts.forEach(c => {
        if (c._id.toString() !== contactId) {
          c.isPrimary = false;
        }
      });
    }

    if (name) contact.name = name.trim();
    if (phone) contact.phone = phone.trim();
    if (email !== undefined) contact.email = email ? email.trim().toLowerCase() : '';
    if (relationship) contact.relationship = relationship;
    if (isPrimary !== undefined) contact.isPrimary = isPrimary;

    await user.save();

    res.json({ 
      message: 'Emergency contact updated successfully',
      contact: contact
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete emergency contact
router.delete('/contacts/:contactId', authenticate, requireUser, async (req, res) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.user._id);
    
    // Initialize emergencyContacts if it doesn't exist
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }
    
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.remove();
    await user.save();

    res.json({ message: 'Emergency contact removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Activate SOS
router.post('/sos', authenticate, requireUser, async (req, res) => {
  try {
    const { latitude, longitude, address, message, tripId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const user = await User.findById(req.user._id)
      .select('emergencyContacts name phoneNumber email')
      .populate('bookings');

    // Initialize emergencyContacts if it doesn't exist
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }

    // Get active trip if tripId provided
    let activeTrip = null;
    if (tripId) {
      activeTrip = user.bookings.find(t => t._id.toString() === tripId);
    }

    // Prepare contacts to notify
    const contactsToNotify = user.emergencyContacts
      .filter(c => c.isPrimary || user.emergencyContacts.filter(ec => ec.isPrimary).length === 0)
      .map(contact => ({
        contactId: contact._id.toString(),
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        notificationMethod: contact.email ? 'email' : 'sms',
        status: 'pending'
      }));

    // Create emergency event
    const emergencyEvent = new EmergencyEvent({
      user: user._id,
      eventType: 'SOS',
      location: {
        latitude,
        longitude,
        address: address || '',
        accuracy: req.body.accuracy || null
      },
      trip: activeTrip ? activeTrip._id : null,
      contactsNotified: contactsToNotify,
      message: message || 'Emergency SOS activated',
      resolved: false
    });

    await emergencyEvent.save();

    // Format emergency message
    const emergencyMessage = `🚨 EMERGENCY SOS ALERT 🚨\n\n` +
      `User: ${user.name}\n` +
      `Phone: ${user.phoneNumber}\n` +
      `Email: ${user.email}\n` +
      `Location: ${address || `${latitude}, ${longitude}`}\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      (activeTrip ? `Trip: ${activeTrip.district || 'Unknown location'}\n` : '') +
      (message ? `Message: ${message}\n` : '') +
      `\nPlease contact the user immediately or local emergency services.`;

    // TODO: Send notifications to contacts (email/SMS service integration)
    // For now, we'll just log and store the event
    console.log('SOS ACTIVATED:', {
      userId: user._id,
      userName: user.name,
      location: { latitude, longitude, address },
      contactsToNotify: contactsToNotify.length,
      message: emergencyMessage
    });

    res.json({
      message: 'SOS activated successfully. Emergency contacts will be notified.',
      event: emergencyEvent,
      contactsNotified: contactsToNotify.length
    });
  } catch (error) {
    console.error('SOS activation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get SOS history
router.get('/sos/history', authenticate, requireUser, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await EmergencyEvent.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('trip', 'district state country fromDate toDate')
      .lean();

    const total = await EmergencyEvent.countDocuments({ user: req.user._id });

    res.json({
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emergency numbers by country
router.get('/emergency-numbers/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const countryCode = country.toUpperCase();

    let emergencyNumbers = await EmergencyNumbers.findOne({ country: countryCode });

    // If not found in database, return common defaults
    if (!emergencyNumbers) {
      const defaults = getDefaultEmergencyNumbers(countryCode);
      if (defaults) {
        return res.json({ numbers: defaults, source: 'default' });
      }
      return res.status(404).json({ message: 'Emergency numbers not found for this country' });
    }

    res.json({ numbers: emergencyNumbers, source: 'database' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all emergency numbers (for admin/listing)
router.get('/emergency-numbers', async (req, res) => {
  try {
    const numbers = await EmergencyNumbers.find({}).sort({ countryName: 1 });
    res.json({ numbers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update emergency information
router.put('/emergency-info', authenticate, requireUser, async (req, res) => {
  try {
    const { medicalInfo, bloodType, allergies, medications, insuranceInfo } = req.body;

    // Check if user exists
    const userCheck = await User.findById(req.user._id).lean();
    if (!userCheck) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build the emergencyInfo object
    const emergencyInfoUpdate = {};

    // Get existing emergencyInfo or use defaults
    const existingInfo = userCheck.emergencyInfo || {
      medicalInfo: '',
      bloodType: null,
      allergies: [],
      medications: [],
      insuranceInfo: {
        provider: '',
        policyNumber: '',
        emergencyContact: ''
      }
    };

    // Update fields if provided, otherwise keep existing values
    emergencyInfoUpdate.medicalInfo = medicalInfo !== undefined ? (medicalInfo || '') : existingInfo.medicalInfo || '';
    emergencyInfoUpdate.bloodType = bloodType !== undefined ? (bloodType || null) : existingInfo.bloodType || null;
    emergencyInfoUpdate.allergies = allergies !== undefined ? (Array.isArray(allergies) ? allergies : []) : (existingInfo.allergies || []);
    emergencyInfoUpdate.medications = medications !== undefined ? (Array.isArray(medications) ? medications : []) : (existingInfo.medications || []);
    
    if (insuranceInfo !== undefined) {
      emergencyInfoUpdate.insuranceInfo = {
        provider: insuranceInfo?.provider || '',
        policyNumber: insuranceInfo?.policyNumber || '',
        emergencyContact: insuranceInfo?.emergencyContact || ''
      };
    } else {
      emergencyInfoUpdate.insuranceInfo = existingInfo.insuranceInfo || {
        provider: '',
        policyNumber: '',
        emergencyContact: ''
      };
    }

    // Use updateOne to update only the emergencyInfo field (avoids full document validation)
    const updateResult = await User.updateOne(
      { _id: req.user._id },
      { $set: { emergencyInfo: emergencyInfoUpdate } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Emergency information updated successfully',
      emergencyInfo: emergencyInfoUpdate
    });
  } catch (error) {
    console.error('Error updating emergency info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emergency information
router.get('/emergency-info', authenticate, requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyInfo emergencyContacts');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return emergencyInfo or empty object if it doesn't exist
    const emergencyInfo = user.emergencyInfo || {
      medicalInfo: '',
      bloodType: null,
      allergies: [],
      medications: [],
      insuranceInfo: {
        provider: '',
        policyNumber: '',
        emergencyContact: ''
      }
    };

    // Get primary contact if emergencyContacts exists
    const primaryContact = (user.emergencyContacts && Array.isArray(user.emergencyContacts))
      ? user.emergencyContacts.find(c => c && c.isPrimary) || null
      : null;

    res.json({
      emergencyInfo: emergencyInfo,
      primaryContact: primaryContact
    });
  } catch (error) {
    console.error('Error fetching emergency info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function for default emergency numbers
function getDefaultEmergencyNumbers(countryCode) {
  const defaults = {
    'US': {
      country: 'US',
      countryName: 'United States',
      police: '911',
      fire: '911',
      ambulance: '911',
      emergency: '911',
      notes: 'All emergencies: 911'
    },
    'IN': {
      country: 'IN',
      countryName: 'India',
      police: '100',
      fire: '101',
      ambulance: '102',
      emergency: '112',
      notes: 'Police: 100, Fire: 101, Ambulance: 102, Emergency: 112'
    },
    'GB': {
      country: 'GB',
      countryName: 'United Kingdom',
      police: '999',
      fire: '999',
      ambulance: '999',
      emergency: '999',
      notes: 'All emergencies: 999'
    },
    'CA': {
      country: 'CA',
      countryName: 'Canada',
      police: '911',
      fire: '911',
      ambulance: '911',
      emergency: '911',
      notes: 'All emergencies: 911'
    },
    'AU': {
      country: 'AU',
      countryName: 'Australia',
      police: '000',
      fire: '000',
      ambulance: '000',
      emergency: '000',
      notes: 'All emergencies: 000'
    },
    'DE': {
      country: 'DE',
      countryName: 'Germany',
      police: '110',
      fire: '112',
      ambulance: '112',
      emergency: '112',
      notes: 'Police: 110, Fire/Ambulance: 112'
    },
    'FR': {
      country: 'FR',
      countryName: 'France',
      police: '17',
      fire: '18',
      ambulance: '15',
      emergency: '112',
      notes: 'Police: 17, Fire: 18, Ambulance: 15, EU Emergency: 112'
    },
    'JP': {
      country: 'JP',
      countryName: 'Japan',
      police: '110',
      fire: '119',
      ambulance: '119',
      emergency: '110',
      notes: 'Police: 110, Fire/Ambulance: 119'
    }
  };

  return defaults[countryCode] || null;
}

module.exports = router;

