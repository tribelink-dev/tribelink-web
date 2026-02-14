/**
 * Utility script to query LocalHost documents with their provider names
 * Usage: node scripts/queryLocalHosts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LocalHost = require('../models/LocalHost');

const queryLocalHosts = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Query all LocalHost documents with populated providerId
    const localHosts = await LocalHost.find({})
      .populate('providerId', 'name email phoneNumber providerType')
      .select('providerId abodeDetails.title location rating')
      .lean();

    if (localHosts.length === 0) {
      console.log('No LocalHost documents found in the database.');
      return;
    }

    console.log(`Found ${localHosts.length} LocalHost document(s):\n`);
    console.log('─'.repeat(80));

    localHosts.forEach((host, index) => {
      console.log(`\n${index + 1}. LocalHost ID: ${host._id}`);
      
      if (host.providerId) {
        console.log(`   Provider Name: ${host.providerId.name || 'N/A'}`);
        console.log(`   Provider Email: ${host.providerId.email || 'N/A'}`);
        console.log(`   Provider Type: ${host.providerId.providerType || 'N/A'}`);
      } else {
        console.log(`   ⚠️  Provider not found (providerId: ${host.providerId})`);
      }
      
      if (host.abodeDetails && host.abodeDetails.title) {
        console.log(`   Abode Title: ${host.abodeDetails.title}`);
      }
      
      if (host.location) {
        const loc = host.location;
        console.log(`   Location: ${loc.district || ''}, ${loc.state || ''}, ${loc.country || ''}`);
      }
      
      console.log(`   Rating: ${host.rating || 'N/A'}`);
      console.log('─'.repeat(80));
    });

    // Query by specific provider name (example)
    console.log('\n\nExample: Query by provider name');
    console.log('─'.repeat(80));
    const exampleName = localHosts[0]?.providerId?.name;
    if (exampleName) {
      const hostsByName = await LocalHost.find({})
        .populate({
          path: 'providerId',
          match: { name: exampleName },
          select: 'name email'
        })
        .lean();
      
      const matchingHosts = hostsByName.filter(h => h.providerId !== null);
      console.log(`\nLocalHosts with provider name "${exampleName}": ${matchingHosts.length}`);
      matchingHosts.forEach(h => {
        console.log(`  - ${h.providerId.name} (${h._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('connection')) {
      console.log('\n💡 Make sure MongoDB is running:');
      console.log('   sudo systemctl start mongod');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
queryLocalHosts();








