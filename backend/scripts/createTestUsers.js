/**
 * Sample Test Users Generator
 * 
 * This script creates sample test users for all account types:
 * - Regular Users (Travelers)
 * - Experience Hosts
 * - Tour Guides
 * - Hotel Owners (Accommodation Providers)
 * - Driver Partners
 * 
 * Usage: node backend/scripts/createTestUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Provider = require('../models/Provider');

const connectDB = require('../config/database');

// Sample test users data
const sampleUsers = [
  // Regular Users (Travelers)
  {
    email: 'traveler1@test.com',
    phoneNumber: '+1234567890',
    password: 'password123',
    name: 'John Traveler'
  },
  {
    email: 'traveler2@test.com',
    phoneNumber: '+1234567891',
    password: 'password123',
    name: 'Sarah Explorer'
  },
  {
    email: 'traveler3@test.com',
    phoneNumber: '+1234567892',
    password: 'password123',
    name: 'Mike Adventurer'
  }
];

const sampleProviders = [
  // Experience Hosts
  {
    email: 'experience.host1@test.com',
    phoneNumber: '+1234567800',
    password: 'password123',
    name: 'Alice Experience Host',
    providerType: 'EXPERIENCE_HOST',
    role: 'Host'
  },
  {
    email: 'experience.host2@test.com',
    phoneNumber: '+1234567801',
    password: 'password123',
    name: 'Bob Adventure Guide',
    providerType: 'EXPERIENCE_HOST',
    role: 'Host'
  },
  // Tour Guides
  {
    email: 'guide1@test.com',
    phoneNumber: '+1234567810',
    password: 'password123',
    name: 'Emma Tour Guide',
    providerType: 'GUIDE',
    role: 'Guide'
  },
  {
    email: 'guide2@test.com',
    phoneNumber: '+1234567811',
    password: 'password123',
    name: 'David Local Expert',
    providerType: 'GUIDE',
    role: 'Guide'
  },
  // Hotel Owners (Accommodation Providers)
  {
    email: 'hotel.owner1@test.com',
    phoneNumber: '+1234567820',
    password: 'password123',
    name: 'Luxury Hotel Group',
    providerType: 'ACCOMMODATION_PROVIDER'
  },
  {
    email: 'hotel.owner2@test.com',
    phoneNumber: '+1234567821',
    password: 'password123',
    name: 'Budget Stay Inn',
    providerType: 'ACCOMMODATION_PROVIDER'
  },
  {
    email: 'hotel.owner3@test.com',
    phoneNumber: '+1234567822',
    password: 'password123',
    name: 'Boutique Hotel Collection',
    providerType: 'ACCOMMODATION_PROVIDER'
  },
  // Driver Partners
  {
    email: 'driver1@test.com',
    phoneNumber: '+1234567830',
    password: 'password123',
    name: 'Premium Transport Services',
    providerType: 'DRIVER_PARTNER'
  },
  {
    email: 'driver2@test.com',
    phoneNumber: '+1234567831',
    password: 'password123',
    name: 'Comfort Rides',
    providerType: 'DRIVER_PARTNER'
  },
  {
    email: 'driver3@test.com',
    phoneNumber: '+1234567832',
    password: 'password123',
    name: 'Reliable Chauffeur',
    providerType: 'DRIVER_PARTNER'
  }
];

async function createTestUsers() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Create regular users
    console.log('\n=== Creating Regular Users (Travelers) ===');
    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email },
            { phoneNumber: userData.phoneNumber }
          ]
        });

        if (existingUser) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        const user = new User({
          email: userData.email.toLowerCase(),
          phoneNumber: userData.phoneNumber,
          password: hashedPassword,
          name: userData.name,
          tripWallet: { balance: 0, currency: 'USD' }
        });

        await user.save();
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    // Create providers
    console.log('\n=== Creating Service Providers ===');
    for (const providerData of sampleProviders) {
      try {
        // Check if provider already exists
        const existingProvider = await Provider.findOne({ 
          $or: [
            { email: providerData.email.toLowerCase() },
            { phoneNumber: providerData.phoneNumber }
          ]
        });

        if (existingProvider) {
          console.log(`⏭️  Provider ${providerData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(providerData.password, 10);

        // Prepare provider data
        const providerDataToSave = {
          email: providerData.email.toLowerCase(),
          phoneNumber: providerData.phoneNumber,
          password: hashedPassword,
          name: providerData.name,
          providerType: providerData.providerType
        };

        // Add role only for EXPERIENCE_HOST and GUIDE
        if (providerData.role) {
          providerDataToSave.role = providerData.role;
        }

        // Create provider
        const provider = new Provider(providerDataToSave);
        await provider.save();
        
        const providerTypeLabel = {
          'EXPERIENCE_HOST': 'Experience Host',
          'GUIDE': 'Tour Guide',
          'ACCOMMODATION_PROVIDER': 'Hotel Owner',
          'DRIVER_PARTNER': 'Driver Partner'
        }[providerData.providerType];

        console.log(`✅ Created ${providerTypeLabel}: ${providerData.name} (${providerData.email})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Provider ${providerData.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating provider ${providerData.email}:`, error.message);
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log('✅ Test users creation completed!');
    console.log('\n📝 Login Credentials:');
    console.log('\nRegular Users (Travelers):');
    sampleUsers.forEach(user => {
      console.log(`  Email: ${user.email} | Phone: ${user.phoneNumber} | Password: ${user.password}`);
    });
    
    console.log('\nService Providers:');
    sampleProviders.forEach(provider => {
      const typeLabel = {
        'EXPERIENCE_HOST': 'Experience Host',
        'GUIDE': 'Tour Guide',
        'ACCOMMODATION_PROVIDER': 'Hotel Owner',
        'DRIVER_PARTNER': 'Driver Partner'
      }[provider.providerType];
      console.log(`  ${typeLabel}: ${provider.email} | Phone: ${provider.phoneNumber} | Password: ${provider.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

// Run the script
createTestUsers();

