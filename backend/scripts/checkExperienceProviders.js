/**
 * Diagnostic script to check experience-provider relationships
 * Usage: node scripts/checkExperienceProviders.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Experience = require('../models/Experience');
const Host = require('../models/Host');

const checkExperienceProviders = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get all experiences
    const experiences = await Experience.find({})
      .populate({
        path: 'provider',
        select: 'name email providerType rating',
        model: 'Host'
      })
      .select('_id title provider')
      .lean();

    console.log(`Found ${experiences.length} experience(s) in database\n`);
    console.log('='.repeat(80));

    if (experiences.length === 0) {
      console.log('No experiences found in the database.');
      await mongoose.disconnect();
      return;
    }

    // Statistics
    let validProviders = 0;
    let missingProviders = 0;
    let providersWithoutNames = 0;
    let invalidProviderIds = 0;
    const issues = [];

    // Check each experience
    for (const exp of experiences) {
      const expId = exp._id.toString();
      const providerId = exp.provider?._id?.toString() || (typeof exp.provider === 'string' ? exp.provider : null);

      if (!exp.provider) {
        missingProviders++;
        issues.push({
          experienceId: expId,
          title: exp.title,
          issue: 'No provider populated',
          providerId: providerId || 'N/A'
        });
        continue;
      }

      if (typeof exp.provider === 'string') {
        // Provider is just an ID, try to fetch it
        try {
          const provider = await Host.findById(exp.provider).select('name email providerType').lean();
          if (!provider) {
            invalidProviderIds++;
            issues.push({
              experienceId: expId,
              title: exp.title,
              issue: 'Provider ID does not exist in database',
              providerId: exp.provider
            });
          } else if (!provider.name || !provider.name.trim()) {
            providersWithoutNames++;
            issues.push({
              experienceId: expId,
              title: exp.title,
              issue: 'Provider exists but has no name',
              providerId: provider._id.toString(),
              providerEmail: provider.email
            });
          } else {
            validProviders++;
          }
        } catch (err) {
          invalidProviderIds++;
          issues.push({
            experienceId: expId,
            title: exp.title,
            issue: 'Error fetching provider',
            providerId: exp.provider,
            error: err.message
          });
        }
      } else if (exp.provider._id) {
        // Provider is populated
        if (!exp.provider.name || !exp.provider.name.trim()) {
          providersWithoutNames++;
          issues.push({
            experienceId: expId,
            title: exp.title,
            issue: 'Provider populated but has no name',
            providerId: exp.provider._id.toString(),
            providerEmail: exp.provider.email || 'N/A',
            providerType: exp.provider.providerType || 'N/A'
          });
        } else {
          validProviders++;
        }
      } else {
        missingProviders++;
        issues.push({
          experienceId: expId,
          title: exp.title,
          issue: 'Provider object is invalid',
          providerObject: exp.provider
        });
      }
    }

    // Print statistics
    console.log('\n📊 STATISTICS:');
    console.log('─'.repeat(80));
    console.log(`✅ Valid providers with names: ${validProviders}`);
    console.log(`❌ Missing providers: ${missingProviders}`);
    console.log(`⚠️  Providers without names: ${providersWithoutNames}`);
    console.log(`🔴 Invalid provider IDs: ${invalidProviderIds}`);
    console.log(`📝 Total issues: ${issues.length}`);

    // Print sample experiences with valid providers
    console.log('\n✅ SAMPLE EXPERIENCES WITH VALID PROVIDERS:');
    console.log('─'.repeat(80));
    let validCount = 0;
    for (const exp of experiences) {
      if (validCount >= 5) break;
      
      let providerName = null;
      if (exp.provider && typeof exp.provider === 'object' && exp.provider.name) {
        providerName = exp.provider.name;
      } else if (typeof exp.provider === 'string') {
        try {
          const provider = await Host.findById(exp.provider).select('name').lean();
          providerName = provider?.name || null;
        } catch (err) {
          continue;
        }
      }
      
      if (providerName && providerName.trim()) {
        console.log(`\nExperience: ${exp.title}`);
        console.log(`  ID: ${exp._id}`);
        console.log(`  Provider: ${providerName}`);
        validCount++;
      }
    }

    // Print issues
    if (issues.length > 0) {
      console.log('\n\n❌ ISSUES FOUND:');
      console.log('─'.repeat(80));
      issues.slice(0, 20).forEach((issue, idx) => {
        console.log(`\n${idx + 1}. Experience: ${issue.title}`);
        console.log(`   ID: ${issue.experienceId}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.providerId) console.log(`   Provider ID: ${issue.providerId}`);
        if (issue.providerEmail) console.log(`   Provider Email: ${issue.providerEmail}`);
        if (issue.error) console.log(`   Error: ${issue.error}`);
      });
      
      if (issues.length > 20) {
        console.log(`\n... and ${issues.length - 20} more issues`);
      }
    }

    // Check all Host documents
    console.log('\n\n👥 HOST/PROVIDER DOCUMENTS IN DATABASE:');
    console.log('─'.repeat(80));
    const allHosts = await Host.find({})
      .select('_id name email providerType')
      .lean();
    
    console.log(`Total Host/Provider documents: ${allHosts.length}`);
    
    const hostsWithoutNames = allHosts.filter(h => !h.name || !h.name.trim());
    if (hostsWithoutNames.length > 0) {
      console.log(`\n⚠️  Hosts without names: ${hostsWithoutNames.length}`);
      hostsWithoutNames.slice(0, 10).forEach(host => {
        console.log(`   ID: ${host._id}, Email: ${host.email || 'N/A'}, Type: ${host.providerType || 'N/A'}`);
      });
    }

    // Check provider IDs in experiences vs actual hosts
    console.log('\n\n🔍 PROVIDER ID VALIDATION:');
    console.log('─'.repeat(80));
    const allProviderIds = new Set(allHosts.map(h => h._id.toString()));
    let experiencesWithInvalidProviderIds = 0;
    
    for (const exp of experiences) {
      let providerId = null;
      if (exp.provider && typeof exp.provider === 'string') {
        providerId = exp.provider;
      } else if (exp.provider && exp.provider._id) {
        providerId = exp.provider._id.toString();
      }
      
      if (providerId && !allProviderIds.has(providerId)) {
        experiencesWithInvalidProviderIds++;
      }
    }
    
    if (experiencesWithInvalidProviderIds > 0) {
      console.log(`⚠️  Experiences with provider IDs that don't exist: ${experiencesWithInvalidProviderIds}`);
    } else {
      console.log('✅ All experience provider IDs exist in Host collection');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
checkExperienceProviders();

