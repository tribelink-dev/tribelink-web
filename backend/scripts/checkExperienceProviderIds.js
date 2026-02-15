/**
 * Check if experiences have provider IDs stored (before populate)
 * Usage: node scripts/checkExperienceProviderIds.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Experience = require('../models/Experience');
const Host = require('../models/Host');

const checkProviderIds = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get experiences WITHOUT populate to see raw provider field
    const experiences = await Experience.find({})
      .select('_id title provider')
      .lean();

    console.log(`Found ${experiences.length} experience(s)\n`);
    console.log('='.repeat(80));

    let hasProviderId = 0;
    let noProviderId = 0;
    const providerIds = new Set();
    const invalidProviderIds = [];

    for (const exp of experiences) {
      const providerValue = exp.provider;
      
      if (!providerValue) {
        noProviderId++;
        console.log(`❌ ${exp.title} (${exp._id}): NO PROVIDER FIELD`);
      } else if (typeof providerValue === 'string') {
        hasProviderId++;
        providerIds.add(providerValue);
        console.log(`✅ ${exp.title}: Provider ID = ${providerValue}`);
      } else if (providerValue && providerValue._id) {
        hasProviderId++;
        const idStr = providerValue._id.toString();
        providerIds.add(idStr);
        console.log(`✅ ${exp.title}: Provider ID = ${idStr} (already populated)`);
      } else {
        noProviderId++;
        console.log(`⚠️  ${exp.title}: Invalid provider value:`, providerValue);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Experiences with provider IDs: ${hasProviderId}`);
    console.log(`   Experiences without provider IDs: ${noProviderId}`);
    console.log(`   Unique provider IDs: ${providerIds.size}`);

    // Check if these provider IDs exist in Host collection
    console.log('\n🔍 Validating provider IDs against Host collection...\n');
    const allHostIds = new Set();
    const hosts = await Host.find({}).select('_id name').lean();
    hosts.forEach(h => allHostIds.add(h._id.toString()));

    let validIds = 0;
    let invalidIds = 0;
    const missingHosts = [];

    for (const providerId of providerIds) {
      if (allHostIds.has(providerId)) {
        validIds++;
        const host = hosts.find(h => h._id.toString() === providerId);
        console.log(`✅ Provider ID ${providerId} exists - Name: ${host?.name || 'NO NAME'}`);
      } else {
        invalidIds++;
        missingHosts.push(providerId);
        console.log(`❌ Provider ID ${providerId} does NOT exist in Host collection`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Validation Summary:`);
    console.log(`   Valid provider IDs: ${validIds}`);
    console.log(`   Invalid provider IDs: ${invalidIds}`);
    
    if (missingHosts.length > 0) {
      console.log(`\n❌ Missing Host IDs: ${missingHosts.join(', ')}`);
    }

    // Now test populate
    console.log('\n\n🧪 Testing populate...\n');
    const testExp = experiences[0];
    if (testExp && testExp.provider) {
      const providerId = typeof testExp.provider === 'string' ? testExp.provider : testExp.provider._id?.toString();
      console.log(`Testing with experience: ${testExp.title}`);
      console.log(`Provider ID: ${providerId}`);
      
      const populated = await Experience.findById(testExp._id)
        .populate({
          path: 'provider',
          select: 'name email',
          model: 'Host'
        })
        .lean();
      
      console.log(`Populated result:`, populated?.provider);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkProviderIds();

