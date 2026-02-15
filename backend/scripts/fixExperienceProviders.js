/**
 * Fix experiences that are missing provider IDs
 * This script will:
 * 1. Find experiences without provider fields
 * 2. Try to assign them to a default provider or remove them
 * Usage: node scripts/fixExperienceProviders.js [--dry-run]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Experience = require('../models/Experience');
const Host = require('../models/Host');

const fixExperienceProviders = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Get all experiences
    const experiences = await Experience.find({})
      .select('_id title provider')
      .lean();

    console.log(`Found ${experiences.length} experience(s)\n`);

    // Find experiences without provider
    const experiencesWithoutProvider = experiences.filter(exp => {
      if (!exp.provider) return true;
      if (typeof exp.provider === 'string' && !exp.provider.trim()) return true;
      return false;
    });

    console.log(`Experiences without provider: ${experiencesWithoutProvider.length}\n`);

    if (experiencesWithoutProvider.length === 0) {
      console.log('✅ All experiences have provider IDs');
      await mongoose.disconnect();
      return;
    }

    // Get all hosts to find a default provider
    const hosts = await Host.find({})
      .select('_id name email providerType')
      .lean();

    if (hosts.length === 0) {
      console.log('❌ No hosts found in database. Cannot assign default provider.');
      await mongoose.disconnect();
      return;
    }

    // Find a suitable default provider (prefer EXPERIENCE_HOST type)
    let defaultProvider = hosts.find(h => h.providerType === 'EXPERIENCE_HOST');
    if (!defaultProvider) {
      defaultProvider = hosts[0]; // Use first host as fallback
    }

    console.log(`Using default provider: ${defaultProvider.name} (${defaultProvider._id})\n`);

    console.log('Experiences to fix:');
    console.log('─'.repeat(80));
    experiencesWithoutProvider.forEach((exp, idx) => {
      console.log(`${idx + 1}. ${exp.title} (${exp._id})`);
    });

    if (isDryRun) {
      console.log('\n🔍 DRY RUN: Would assign default provider to these experiences');
      console.log(`   Default provider: ${defaultProvider.name} (${defaultProvider._id})`);
    } else {
      console.log('\n🔧 Fixing experiences...\n');
      
      let fixed = 0;
      let errors = 0;

      for (const exp of experiencesWithoutProvider) {
        try {
          await Experience.updateOne(
            { _id: exp._id },
            { $set: { provider: defaultProvider._id } }
          );
          fixed++;
          console.log(`✅ Fixed: ${exp.title}`);
        } catch (err) {
          errors++;
          console.error(`❌ Error fixing ${exp.title}:`, err.message);
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Fixed: ${fixed}`);
      console.log(`   Errors: ${errors}`);
    }

    console.log('\n✅ Script complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

fixExperienceProviders();

