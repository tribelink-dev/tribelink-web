/**
 * Search for a specific experience in the database
 * Usage: node scripts/searchExperience.js "experience title" [host name]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Experience = require('../models/Experience');
const Host = require('../models/Host');

const searchExperience = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get search terms from command line arguments
    const searchTitle = process.argv[2] || 'Sufi';
    const hostName = process.argv[3] || 'Sanathosh';

    console.log(`Searching for experiences with title containing: "${searchTitle}"`);
    if (hostName) {
      console.log(`And host name containing: "${hostName}"\n`);
    }
    console.log('='.repeat(80));

    // Search for experiences by title
    const experiences = await Experience.find({
      title: { $regex: new RegExp(searchTitle, 'i') }
    })
      .populate({
        path: 'provider',
        select: 'name email providerType',
        model: 'Host'
      })
      .select('_id title provider location')
      .lean();

    console.log(`Found ${experiences.length} experience(s) matching title\n`);

    if (experiences.length === 0) {
      console.log('No experiences found. Searching all experiences...\n');
      const allExperiences = await Experience.find({})
        .populate({
          path: 'provider',
          select: 'name email providerType',
          model: 'Host'
        })
        .select('_id title provider location')
        .limit(50)
        .lean();
      
      console.log(`Total experiences in database: ${await Experience.countDocuments({})}`);
      console.log('\nSample experiences:');
      allExperiences.slice(0, 10).forEach(exp => {
        const providerName = exp.provider?.name || (typeof exp.provider === 'string' ? 'ID: ' + exp.provider : 'Unknown');
        console.log(`  - ${exp.title} (Provider: ${providerName})`);
      });
      
      await mongoose.disconnect();
      return;
    }

    // Filter by host name if provided
    let filteredExperiences = experiences;
    if (hostName) {
      filteredExperiences = experiences.filter(exp => {
        if (!exp.provider) return false;
        if (typeof exp.provider === 'object' && exp.provider.name) {
          return exp.provider.name.toLowerCase().includes(hostName.toLowerCase());
        }
        return false;
      });
    }

    console.log(`Filtered results: ${filteredExperiences.length} experience(s)\n`);

    // Display results
    filteredExperiences.forEach((exp, idx) => {
      console.log(`\n${idx + 1}. Experience: ${exp.title}`);
      console.log(`   ID: ${exp._id}`);
      
      if (exp.provider) {
        if (typeof exp.provider === 'object' && exp.provider.name) {
          console.log(`   Provider: ${exp.provider.name}`);
          console.log(`   Provider Email: ${exp.provider.email || 'N/A'}`);
          console.log(`   Provider Type: ${exp.provider.providerType || 'N/A'}`);
          console.log(`   Provider ID: ${exp.provider._id}`);
        } else if (typeof exp.provider === 'string') {
          console.log(`   Provider ID (string): ${exp.provider}`);
          // Try to fetch provider
          try {
            const provider = await Host.findById(exp.provider).select('name email providerType').lean();
            if (provider) {
              console.log(`   Provider Name: ${provider.name}`);
              console.log(`   Provider Email: ${provider.email}`);
              console.log(`   Provider Type: ${provider.providerType || 'N/A'}`);
            } else {
              console.log(`   Provider: NOT FOUND in database`);
            }
          } catch (err) {
            console.log(`   Provider: Error fetching - ${err.message}`);
          }
        } else {
          console.log(`   Provider: Invalid format`);
        }
      } else {
        console.log(`   Provider: NOT SET`);
      }
      
      if (exp.location) {
        console.log(`   Location: ${exp.location.district || 'N/A'}, ${exp.location.state || 'N/A'}`);
      }
    });

    // If no results after filtering, show all matching experiences
    if (filteredExperiences.length === 0 && experiences.length > 0) {
      console.log('\n⚠️  No experiences found with matching host name. Showing all matching titles:\n');
      experiences.forEach((exp, idx) => {
        const providerName = exp.provider?.name || (typeof exp.provider === 'string' ? 'ID: ' + exp.provider : 'Unknown');
        console.log(`${idx + 1}. ${exp.title} (Provider: ${providerName})`);
      });
    }

    // Search for host by name
    if (hostName) {
      console.log('\n' + '='.repeat(80));
      console.log(`\nSearching for hosts with name containing: "${hostName}"\n`);
      
      const hosts = await Host.find({
        name: { $regex: new RegExp(hostName, 'i') }
      })
        .select('_id name email providerType')
        .lean();
      
      console.log(`Found ${hosts.length} host(s):\n`);
      hosts.forEach((host, idx) => {
        console.log(`${idx + 1}. ${host.name}`);
        console.log(`   ID: ${host._id}`);
        console.log(`   Email: ${host.email}`);
        console.log(`   Type: ${host.providerType || 'N/A'}`);
        
        // Find experiences for this host
        try {
          const exps = await Experience.find({ provider: host._id })
            .select('_id title location')
            .lean();
          if (exps.length > 0) {
            console.log(`   Experiences (${exps.length}):`);
            exps.forEach(exp => {
              const location = exp.location ? `${exp.location.district || 'N/A'}, ${exp.location.state || 'N/A'}` : 'N/A';
              console.log(`     - ${exp.title} (${exp._id})`);
              console.log(`       Location: ${location}`);
            });
          } else {
            console.log(`   Experiences: None`);
          }
        } catch (err) {
          console.log(`   Error fetching experiences: ${err.message}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Search complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

searchExperience();

