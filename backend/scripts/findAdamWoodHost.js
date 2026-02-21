/**
 * Script to find the email of the host providing "Adam Wood house abode"
 * Usage: node backend/scripts/findAdamWoodHost.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LocalHost = require('../models/LocalHost');
const connectDB = require('../config/database');

const findAdamWoodHost = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Search for abode with "Adam Wood" or "Adams Wood" in the title (case-insensitive)
    const searchTerm = 'Adam.*Wood|Adams.*Wood';
    const localHost = await LocalHost.findOne({
      'abodeDetails.title': { $regex: searchTerm, $options: 'i' }
    })
      .populate('providerId', 'name email phoneNumber providerType')
      .lean();

    if (!localHost) {
      console.log(`❌ No abode found with "${searchTerm}" in the title.`);
      console.log('\nSearching for similar abodes...\n');
      
      // Try a broader search
      const similarAbodes = await LocalHost.find({
        $or: [
          { 'abodeDetails.title': { $regex: 'adam', $options: 'i' } },
          { 'abodeDetails.title': { $regex: 'wood', $options: 'i' } }
        ]
      })
        .populate('providerId', 'name email phoneNumber')
        .select('abodeDetails.title providerId')
        .lean();
      
      if (similarAbodes.length > 0) {
        console.log(`Found ${similarAbodes.length} similar abode(s):\n`);
        similarAbodes.forEach((abode, index) => {
          console.log(`${index + 1}. ${abode.abodeDetails?.title || 'N/A'}`);
          if (abode.providerId) {
            console.log(`   Host Email: ${abode.providerId.email || 'N/A'}`);
            console.log(`   Host Name: ${abode.providerId.name || 'N/A'}`);
          }
          console.log('');
        });
      } else {
        console.log('No similar abodes found.');
      }
      return;
    }

    // Found the abode
    console.log('✅ Found the abode!\n');
    console.log('─'.repeat(80));
    console.log(`Abode Title: ${localHost.abodeDetails?.title || 'N/A'}`);
    console.log(`Abode ID: ${localHost._id}`);
    
    if (localHost.providerId) {
      console.log('\n📧 Host Information:');
      console.log(`   Name: ${localHost.providerId.name || 'N/A'}`);
      console.log(`   Email: ${localHost.providerId.email || 'N/A'}`);
      console.log(`   Phone: ${localHost.providerId.phoneNumber || 'N/A'}`);
      console.log(`   Provider Type: ${localHost.providerId.providerType || 'N/A'}`);
      
      if (localHost.providerId.email) {
        console.log('\n' + '═'.repeat(80));
        console.log(`🎯 RESULT: The email ID of the host providing "${localHost.abodeDetails?.title}" is:`);
        console.log(`   ${localHost.providerId.email}`);
        console.log('═'.repeat(80));
      }
    } else {
      console.log('\n❌ Provider information not found (providerId is missing or invalid)');
    }

    if (localHost.location) {
      console.log('\n📍 Location:');
      const loc = localHost.location;
      console.log(`   ${loc.address || ''}${loc.address ? ', ' : ''}${loc.district || ''}, ${loc.state || ''}, ${loc.country || ''}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('connection')) {
      console.log('\n💡 Make sure MongoDB is running:');
      console.log('   sudo systemctl start mongod');
      console.log('   OR');
      console.log('   docker start mongodb');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
findAdamWoodHost();

