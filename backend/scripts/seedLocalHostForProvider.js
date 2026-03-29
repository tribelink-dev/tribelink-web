/**
 * Create a LocalHost (abode) for a provider so it appears on Explore (/api/abodes).
 *
 * Usage:
 *   node scripts/seedLocalHostForProvider.js [provider-email]
 *
 * Default email: poothalihomestay@test.com
 *
 * If a LocalHost already exists for that provider, the script exits (unique providerId).
 * Remove or edit that document in MongoDB first if you need to re-seed.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const LocalHost = require('../models/LocalHost');

const email = (process.argv[2] || 'poothalihomestay@test.com').toLowerCase().trim();

// Public HTTPS image for listing cards (swap for your Cloudinary URL in MongoDB anytime)
const DEMO_IMAGE =
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80';

async function main() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
  await mongoose.connect(mongoURI);

  const provider = await Provider.findOne({ email });
  if (!provider) {
    console.error(`No provider with email: ${email}`);
    process.exit(1);
  }

  const existing = await LocalHost.findOne({ providerId: provider._id });
  if (existing) {
    console.error(
      `LocalHost already exists (_id: ${existing._id}). Explore already can show it if isArchived is false.\n` +
        'To replace: delete that document in MongoDB, then run this script again.'
    );
    process.exit(1);
  }

  const doc = {
    providerId: provider._id,
    abodeDetails: {
      title: 'Poothali Homestay — Demo listing',
      description:
        'Traditional stay for your demo: warm hospitality, local food, and quiet surroundings. Edit this text in MongoDB or via the host dashboard after registration.',
      capacity: 4,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['WiFi', 'Home-cooked meals', 'Garden'],
      houseRules: ['Respect local customs', 'No smoking indoors'],
      propertyType: 'Traditional Home',
    },
    culturalPractices: [],
    nearbyPlaces: [],
    availability: [],
    pricing: {
      pricePerNight: 3500,
      currency: 'INR',
      weeklyDiscount: 0,
      monthlyDiscount: 0,
    },
    images: [
      { url: DEMO_IMAGE, isMain: true, caption: 'Homestay' },
    ],
    languages: ['English', 'Malayalam'],
    familyInfo: {
      background: 'Family-run homestay (seeded for demo).',
    },
    location: {
      country: 'India',
      state: 'Kerala',
      district: 'Wayanad',
      address: 'Seeded address — update in DB',
      coordinates: { lat: 11.6854, lng: 76.132 },
      nearbyLandmarks: [],
    },
    roomVariants: [],
    defaultVariantId: null,
    linkedExperiences: [],
    isVerified: true,
    isArchived: false,
    rating: 5,
    ratingCount: 0,
  };

  const created = await LocalHost.create(doc);
  console.log('Created LocalHost for Explore:');
  console.log('  _id:         ', created._id.toString());
  console.log('  providerId:  ', provider._id.toString());
  console.log('  title:       ', created.abodeDetails.title);
  console.log('\nNext: open Explore on the site and refresh. API: GET /api/abodes');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
