/**
 * Migration Script: Remove Driver Data
 * 
 * This script archives/removes driver-related data from the database
 * Run with: node backend/scripts/migrateRemoveDrivers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function migrateRemoveDrivers() {
  try {
    await connectDB();
    console.log('Connected to database');

    const Trip = require('../models/Trip');
    const Provider = require('../models/Provider');

    // Update all trips to remove driver references
    console.log('Updating trips to remove driver references...');
    const tripsResult = await Trip.updateMany(
      {},
      {
        $unset: {
          assignedDriver: '',
          assignedDriverProfile: '',
          'schedule.$[].chauffeur': '',
          'schedule.$[].chauffeurRequired': '',
          'schedule.$[].assignedDriver': '',
          'schedule.$[].cab': ''
        }
      }
    );
    console.log(`Updated ${tripsResult.modifiedCount} trips`);

    // Remove DRIVER_PARTNER providers (or update their type)
    console.log('Removing DRIVER_PARTNER providers...');
    const driversResult = await Provider.deleteMany({ providerType: 'DRIVER_PARTNER' });
    console.log(`Removed ${driversResult.deletedCount} driver providers`);

    // Note: DriverProvider collection will be empty but we keep the model for now
    // in case we need to reference old data

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateRemoveDrivers();

