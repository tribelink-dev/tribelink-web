/**
 * Cart Model
 * Persistent shopping cart for users to build bookings with room variants and experience add-ons
 */

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  items: [{
    type: {
      type: String,
      enum: ['ABODE_STAY', 'EXPERIENCE'],
      required: true
    },
    
    // Abode stay item
    abodeStay: {
      localHostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LocalHost',
        required: function() { return this.type === 'ABODE_STAY'; }
      },
      variantId: {
        type: String,
        required: function() { return this.type === 'ABODE_STAY'; }
      },
      checkIn: {
        type: Date,
        required: function() { return this.type === 'ABODE_STAY'; }
      },
      checkOut: {
        type: Date,
        required: function() { return this.type === 'ABODE_STAY'; }
      },
      guests: {
        type: Number,
        min: 1,
        default: 1,
        required: function() { return this.type === 'ABODE_STAY'; }
      },
      specialRequests: {
        type: String
      }
    },
    
    // Experiences linked to this abode stay
    experiences: [{
      experienceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      startTime: {
        type: String, // Format: "HH:mm"
        required: true
      },
      participants: {
        type: Number,
        min: 1,
        default: 1
      },
      specialRequests: {
        type: String
      }
    }],
    
    // Standalone experience item
    experience: {
      experienceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
        required: function() { return this.type === 'EXPERIENCE'; }
      },
      date: {
        type: Date,
        required: function() { return this.type === 'EXPERIENCE'; }
      },
      startTime: {
        type: String,
        required: function() { return this.type === 'EXPERIENCE'; }
      },
      participants: {
        type: Number,
        min: 1,
        default: 1,
        required: function() { return this.type === 'EXPERIENCE'; }
      },
      specialRequests: {
        type: String
      }
    },
    
    // Calculated price for this item
    itemPrice: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Cart expiration (e.g., 7 days)
  expiresAt: {
    type: Date,
    default: function() {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now
      return expirationDate;
    }
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Method to calculate total price
cartSchema.methods.calculateTotal = async function() {
  let total = 0;
  const LocalHost = require('./LocalHost');
  const Experience = require('./Experience');
  
  for (const item of this.items) {
    if (item.type === 'ABODE_STAY') {
      const localHost = await LocalHost.findById(item.abodeStay.localHostId);
      if (!localHost) continue;
      
      // Find variant
      const variant = localHost.roomVariants?.find(v => v.variantId === item.abodeStay.variantId);
      let itemTotalPrice = 0;
      
      if (!variant) {
        // Fallback to base pricing
        const checkIn = new Date(item.abodeStay.checkIn);
        const checkOut = new Date(item.abodeStay.checkOut);
        const nights = Math.max(1, Math.min(365, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))));
        const pricePerNight = Number(localHost.pricing?.pricePerNight) || 0;
        let basePrice = pricePerNight * nights;
        
        // Apply discounts
        if (nights >= 30 && localHost.pricing.monthlyDiscount > 0) {
          basePrice *= (1 - localHost.pricing.monthlyDiscount / 100);
        } else if (nights >= 7 && localHost.pricing.weeklyDiscount > 0) {
          basePrice *= (1 - localHost.pricing.weeklyDiscount / 100);
        }
        
        itemTotalPrice = basePrice;
        total += basePrice;
      } else {
        // Use variant pricing
        const checkIn = new Date(item.abodeStay.checkIn);
        const checkOut = new Date(item.abodeStay.checkOut);
        const nights = Math.max(1, Math.min(365, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))));
        const pricePerNight = Number(variant.pricePerNight) || 0;
        let variantPrice = pricePerNight * nights;
        
        // Apply discounts (using base pricing discounts for now)
        if (nights >= 30 && localHost.pricing.monthlyDiscount > 0) {
          variantPrice *= (1 - localHost.pricing.monthlyDiscount / 100);
        } else if (nights >= 7 && localHost.pricing.weeklyDiscount > 0) {
          variantPrice *= (1 - localHost.pricing.weeklyDiscount / 100);
        }
        
        itemTotalPrice = variantPrice;
        total += variantPrice;
      }
      
      // Add experience add-ons to both item price and total
      for (const exp of item.experiences || []) {
        const experience = await Experience.findById(exp.experienceId);
        if (!experience) continue;
        
        let expPrice = Number(experience.price) || 0;
        // Use add-on pricing if available
        if (experience.isAddOn && experience.addOnPricing?.price) {
          expPrice = Number(experience.addOnPricing.price) || 0;
          if (experience.addOnPricing.discount > 0) {
            expPrice *= (1 - Number(experience.addOnPricing.discount) / 100);
          }
        }
        
        // Ensure participants is a valid number (default to 1, max 50)
        const participants = Math.max(1, Math.min(50, Number(exp.participants) || 1));
        const expTotal = expPrice * participants;
        itemTotalPrice += expTotal;
        total += expTotal;
      }
      
      // Set item price to include abode stay + all experiences
      item.itemPrice = Math.round(itemTotalPrice * 100) / 100;
    } else if (item.type === 'EXPERIENCE') {
      const experience = await Experience.findById(item.experience.experienceId);
      if (experience) {
        // Ensure participants is a valid number (default to 1, max 50)
        const participants = Math.max(1, Math.min(50, Number(item.experience.participants) || 1));
        const expPrice = (Number(experience.price) || 0) * participants;
        total += expPrice;
        item.itemPrice = expPrice;
      }
    }
  }
  
  // Ensure total is a valid number (round to 2 decimal places)
  this.totalPrice = Math.max(0, Math.round((total || 0) * 100) / 100);
  
  // Set cart currency based on the first item's currency (all items should use same currency)
  // This ensures the cart currency matches the actual prices being calculated
  // CRITICAL: This must be set correctly to avoid currency conversion errors
  if (this.items.length > 0) {
    const firstItem = this.items[0];
    if (firstItem.type === 'ABODE_STAY') {
      const localHost = await LocalHost.findById(firstItem.abodeStay.localHostId);
      if (localHost && localHost.pricing?.currency) {
        const newCurrency = localHost.pricing.currency;
        if (this.currency !== newCurrency) {
          console.log(`[Cart] Setting cart currency from ${this.currency} to ${newCurrency} based on abode pricing`);
          this.currency = newCurrency;
        }
      } else if (localHost) {
        // Fallback: if no currency specified, default to INR for Indian abodes
        const fallbackCurrency = localHost.location?.country === 'India' ? 'INR' : 'USD';
        if (this.currency !== fallbackCurrency) {
          console.log(`[Cart] Setting cart currency from ${this.currency} to ${fallbackCurrency} (fallback based on location)`);
          this.currency = fallbackCurrency;
        }
      }
    } else if (firstItem.type === 'EXPERIENCE') {
      const experience = await Experience.findById(firstItem.experience.experienceId);
      if (experience && experience.currency) {
        const newCurrency = experience.currency;
        if (this.currency !== newCurrency) {
          console.log(`[Cart] Setting cart currency from ${this.currency} to ${newCurrency} based on experience`);
          this.currency = newCurrency;
        }
      }
    }
  }
  
  return this.totalPrice;
};

module.exports = mongoose.model('Cart', cartSchema);

