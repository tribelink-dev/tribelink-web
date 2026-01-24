/**
 * Migration Script: Archive Hotel Data
 * 
 * This script marks hotels as deprecated but keeps the data
 * Run with: node backend/scripts/migrateArchiveHotels.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function migrateArchiveHotels() {
  try {
    await connectDB();
    console.log('Connected to database');

    const Hotel = require('../models/Hotel');

    // Add deprecated flag to all hotels
    console.log('Marking hotels as deprecated...');
    const hotelsResult = await Hotel.updateMany(
      {},
      {
        $set: {
          deprecated: true,
          deprecatedAt: new Date(),
          deprecatedReason: 'Replaced by abode stays'
        }
      }
    );
    console.log(`Marked ${hotelsResult.modifiedCount} hotels as deprecated`);

    console.log('Migration completed successfully!');
    console.log('Note: Hotels are marked as deprecated but data is preserved for reference.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateArchiveHotels();


