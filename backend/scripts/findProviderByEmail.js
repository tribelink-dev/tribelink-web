/**
 * Look up a Provider by email (for Mongo demo abodes / debugging).
 * Usage: node scripts/findProviderByEmail.js [email]
 * Default email: poothalihomestay@test.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const LocalHost = require('../models/LocalHost');

const email = (process.argv[2] || 'poothalihomestay@test.com').toLowerCase().trim();

async function main() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
  await mongoose.connect(mongoURI);
  console.log('Connected.\n');

  const provider = await Provider.findOne({ email }).lean();
  if (!provider) {
    console.log(`No provider found with email: ${email}`);
    process.exit(1);
  }

  console.log('Provider');
  console.log('  _id:         ', provider._id.toString());
  console.log('  name:        ', provider.name);
  console.log('  email:       ', provider.email);
  console.log('  providerType:', provider.providerType);

  const existing = await LocalHost.findOne({ providerId: provider._id }).lean();
  if (existing) {
    console.log('\nLocalHost already exists for this provider:');
    console.log('  _id:   ', existing._id.toString());
    console.log('  title: ', existing.abodeDetails?.title);
    console.log('\nYou cannot add a second LocalHost (providerId is unique). Edit that doc or use another provider.');
  } else {
    console.log('\nNo LocalHost yet — use providerId in a new localhosts document:');
    console.log(`  "providerId": ObjectId("${provider._id.toString()}")`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
