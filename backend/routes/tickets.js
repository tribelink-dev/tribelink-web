const express = require('express');
const Ticket = require('../models/Ticket');
const { authenticate, requireUser } = require('../middleware/auth');
const Provider = require('../models/Provider');
const { normalizeExperience, getBaseUrlFromRequest } = require('../utils/imageUtils');

const router = express.Router();

// Get user's tickets
router.get('/user', authenticate, requireUser, async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    const query = { user: req.user._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    let tickets = await Ticket.find(query)
      .populate('experience', 'title imageUrl location')
      .populate('provider', 'name')
      .populate('trip', 'fromDate toDate district state')
      .sort({ scheduledDate: 1, startTime: 1 })
      .lean(); // Use lean() for better performance
    
    // Convert to plain objects and ensure all fields are present
    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    tickets = tickets.map(ticket => {
      // Ensure experienceDetails exists (for tickets created before this field was added)
      if (!ticket.experienceDetails && ticket.experience) {
        ticket.experienceDetails = {
          title: ticket.experience.title || 'Untitled Experience',
          price: 0,
          duration: 2,
          location: {
            district: ticket.experience.location?.district || 'Unknown',
            state: ticket.experience.location?.state || 'Unknown',
            country: ticket.experience.location?.country || 'Unknown'
          }
        };
      }
      
      // Normalize experience imageUrl if it exists
      if (ticket.experience && ticket.experience.imageUrl) {
        ticket.experience = normalizeExperience(ticket.experience, baseUrl);
      }
      
      return ticket;
    });
    
    // Filter upcoming tickets if requested
    if (upcoming === 'true') {
      const now = new Date();
      tickets = tickets.filter(ticket => {
        const scheduledDateTime = new Date(ticket.scheduledDate);
        const [hours, minutes] = ticket.startTime.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return scheduledDateTime >= now && ticket.status === 'active';
      });
    }
    
    console.log(`Returning ${tickets.length} tickets for user ${req.user._id}`);
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single ticket by ID
router.get('/:ticketId', authenticate, requireUser, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('experience', 'title description imageUrl location')
      .populate('provider', 'name email phoneNumber')
      .populate('trip', 'fromDate toDate district state')
      .populate('user', 'name email phoneNumber');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user owns this ticket
    if (ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Normalize experience imageUrl if it exists
    const baseUrl = getBaseUrlFromRequest(req);
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
    if (ticketObj.experience && ticketObj.experience.imageUrl) {
      ticketObj.experience = normalizeExperience(ticketObj.experience, baseUrl);
    }
    
    res.json({ ticket: ticketObj });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify ticket (for hosts/providers)
router.post('/verify/:ticketId', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('experience', 'title provider')
      .populate('provider')
      .populate('user', 'name email phoneNumber');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user is a provider
    const provider = await Provider.findById(req.user._id);
    if (!provider) {
      return res.status(403).json({ message: 'Only providers can verify tickets' });
    }
    
    // Check if provider owns the experience
    if (ticket.provider._id.toString() !== provider._id.toString()) {
      return res.status(403).json({ message: 'You can only verify tickets for your own experiences' });
    }
    
    // Check if ticket is valid for verification
    if (!ticket.isValidForVerification()) {
      return res.status(400).json({ 
        message: 'Ticket is not valid for verification at this time',
        details: 'Tickets can be verified 30 minutes before start time and up to 2 hours after end time'
      });
    }
    
    // Verify ticket
    ticket.status = 'verified';
    ticket.verifiedAt = new Date();
    ticket.verifiedBy = provider._id;
    await ticket.save();
    
    res.json({
      message: 'Ticket verified successfully',
      ticket: {
        ticketId: ticket.ticketId,
        experience: ticket.experienceDetails.title,
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        },
        verifiedAt: ticket.verifiedAt
      }
    });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tickets for provider's experiences (for verification interface)
router.get('/provider/verifications', authenticate, async (req, res) => {
  try {
    // Check if user is a provider
    const provider = await Provider.findById(req.user._id);
    if (!provider) {
      return res.status(403).json({ message: 'Only providers can access this endpoint' });
    }
    
    const { date, status } = req.query;
    
    const query = { 
      provider: provider._id
    };
    
    // Apply status filter - if status is provided and not 'all', filter by status
    // Otherwise, default to showing active and verified tickets
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status || status === 'all') {
      // Default: show active and verified tickets, but allow 'all' to show everything
      if (status !== 'all') {
        query.status = { $in: ['active', 'verified'] };
      }
    }
    
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const tickets = await Ticket.find(query)
      .populate('experience', 'title imageUrl')
      .populate('user', 'name email phoneNumber')
      .populate('trip', 'fromDate toDate')
      .sort({ scheduledDate: 1, startTime: 1 })
      .lean();
    
    // Normalize experience imageUrls
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedTickets = tickets.map(ticket => {
      if (ticket.experience && ticket.experience.imageUrl) {
        ticket.experience = normalizeExperience(ticket.experience, baseUrl);
      }
      return ticket;
    });
    
    console.log(`Returning ${normalizedTickets.length} tickets for provider ${provider._id}`);
    res.json({ tickets: normalizedTickets });
  } catch (error) {
    console.error('Error fetching provider tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search ticket by ticket ID (for quick verification)
router.get('/search/:ticketId', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId.toUpperCase() })
      .populate('experience', 'title provider')
      .populate('provider', 'name _id')
      .populate('user', 'name email phoneNumber');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user is a provider and owns the experience
    const provider = await Provider.findById(req.user._id);
    if (provider && ticket.provider._id.toString() === provider._id.toString()) {
      // Provider can see full details
      res.json({ 
        ticket,
        canVerify: ticket.isValidForVerification() && ticket.status === 'active'
      });
    } else {
      // Return limited info for non-owners
      res.json({ 
        ticket: {
          ticketId: ticket.ticketId,
          experience: ticket.experienceDetails.title,
          scheduledDate: ticket.scheduledDate,
          startTime: ticket.startTime,
          status: ticket.status
        },
        canVerify: false
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

