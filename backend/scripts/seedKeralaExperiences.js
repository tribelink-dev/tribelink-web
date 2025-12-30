/**
 * Kerala Regional Authentic Experiences Seeder
 * 
 * This script creates authentic Kerala experiences for all 14 districts of Kerala.
 * Each district gets 3-5 unique regional experiences.
 * 
 * Usage: node backend/scripts/seedKeralaExperiences.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Experience = require('../models/Experience');
const Provider = require('../models/Provider');
const connectDB = require('../config/database');

// Kerala districts with their coordinates (approximate)
const keralaDistricts = [
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { name: 'Pathanamthitta', lat: 9.2648, lng: 76.7870 },
  { name: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
  { name: 'Kottayam', lat: 9.5916, lng: 76.5222 },
  { name: 'Idukki', lat: 9.9189, lng: 76.9444 },
  { name: 'Ernakulam', lat: 9.9312, lng: 76.2673 },
  { name: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { name: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { name: 'Malappuram', lat: 11.0404, lng: 76.0819 },
  { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.1320 },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { name: 'Kasaragod', lat: 12.4984, lng: 74.9899 }
];

// Authentic Kerala experiences by district
const districtExperiences = {
  'Thiruvananthapuram': [
    {
      title: 'Kathakali Performance & Makeup Session',
      description: 'Witness the mesmerizing art of Kathakali, Kerala\'s classical dance-drama. Experience the intricate makeup process (2-3 hours) and watch a live performance. Learn about the stories, expressions, and traditional music.',
      price: 1500,
      duration: 3,
      maxParticipants: 20
    },
    {
      title: 'Padmanabhaswamy Temple Heritage Walk',
      description: 'Explore the architectural marvel of Padmanabhaswamy Temple, one of the richest temples in the world. Learn about its history, architecture, and the legends surrounding it.',
      price: 500,
      duration: 2,
      maxParticipants: 15
    },
    {
      title: 'Kovalam Beach Sunset & Local Cuisine',
      description: 'Enjoy a beautiful sunset at Kovalam Beach followed by an authentic Kerala seafood dinner. Learn about local fishing traditions and coastal culture.',
      price: 1200,
      duration: 4,
      maxParticipants: 12
    },
    {
      title: 'Traditional Ayurvedic Wellness Experience',
      description: 'Experience authentic Ayurvedic treatments including Abhyangam (oil massage) and Shirodhara. Learn about Ayurvedic principles and herbal medicine.',
      price: 2500,
      duration: 3,
      maxParticipants: 8
    }
  ],
  'Kollam': [
    {
      title: 'Ashtamudi Lake Backwater Cruise',
      description: 'Cruise through the serene Ashtamudi Lake, the gateway to Kerala\'s backwaters. Experience traditional houseboat life, see local fishing, and enjoy authentic Kerala meals.',
      price: 1800,
      duration: 5,
      maxParticipants: 15
    },
    {
      title: 'Coconut Processing & Coir Making Workshop',
      description: 'Learn the traditional art of coir making from coconut husks. Participate in processing coconuts and creating coir products. Understand the sustainable practices.',
      price: 800,
      duration: 2,
      maxParticipants: 10
    },
    {
      title: 'Thangassery Lighthouse & Portuguese Heritage',
      description: 'Visit the historic Thangassery Lighthouse and explore Portuguese colonial architecture. Learn about Kollam\'s maritime history and spice trade legacy.',
      price: 600,
      duration: 2,
      maxParticipants: 15
    }
  ],
  'Pathanamthitta': [
    {
      title: 'Sabarimala Pilgrimage Experience',
      description: 'Experience the spiritual journey to Sabarimala Temple. Learn about the pilgrimage traditions, rituals, and the significance of this sacred site. (Note: Respectful of religious practices)',
      price: 1000,
      duration: 6,
      maxParticipants: 20
    },
    {
      title: 'Periyar Tiger Reserve Wildlife Safari',
      description: 'Embark on a wildlife safari in Periyar Tiger Reserve. Spot elephants, tigers, and diverse bird species. Learn about conservation efforts and forest ecosystems.',
      price: 2000,
      duration: 4,
      maxParticipants: 12
    },
    {
      title: 'Traditional Boat Making Workshop',
      description: 'Learn the ancient craft of making traditional Kerala boats (vallam). Work with local craftsmen to understand the techniques passed down through generations.',
      price: 1500,
      duration: 3,
      maxParticipants: 8
    }
  ],
  'Alappuzha': [
    {
      title: 'Alleppey Backwater Houseboat Stay',
      description: 'Experience the iconic Kerala backwaters on a traditional houseboat. Cruise through canals, witness village life, enjoy local cuisine, and sleep under the stars.',
      price: 3500,
      duration: 12,
      maxParticipants: 6
    },
    {
      title: 'Nehru Trophy Boat Race Experience',
      description: 'Witness the thrilling snake boat races (Chundan Vallam) on Punnamada Lake. Learn about the history, training, and cultural significance of this unique sport.',
      price: 1500,
      duration: 3,
      maxParticipants: 30
    },
    {
      title: 'Coir Weaving & Handicraft Workshop',
      description: 'Learn traditional coir weaving techniques and create your own handicrafts. Visit local workshops and understand the sustainable livelihood of artisans.',
      price: 1000,
      duration: 3,
      maxParticipants: 10
    },
    {
      title: 'Kuttanad Paddy Field Experience',
      description: 'Explore Kuttanad, the rice bowl of Kerala, where farming happens below sea level. Learn about unique agricultural practices and interact with local farmers.',
      price: 1200,
      duration: 4,
      maxParticipants: 12
    }
  ],
  'Kottayam': [
    {
      title: 'Traditional Kerala Cooking Class',
      description: 'Learn to cook authentic Kerala dishes including appam, stew, and fish curry. Understand the use of local spices and traditional cooking methods.',
      price: 1500,
      duration: 3,
      maxParticipants: 8
    },
    {
      title: 'Rubber Plantation Tour & Processing',
      description: 'Visit a rubber plantation and learn about rubber tapping, processing, and its economic importance. Experience the daily life of plantation workers.',
      price: 800,
      duration: 2,
      maxParticipants: 12
    },
    {
      title: 'Kumarakom Bird Sanctuary Tour',
      description: 'Explore the Kumarakom Bird Sanctuary on a boat tour. Spot migratory birds, learn about local bird species, and enjoy the serene backwater ecosystem.',
      price: 1000,
      duration: 3,
      maxParticipants: 10
    }
  ],
  'Idukki': [
    {
      title: 'Tea Plantation Tour & Tasting',
      description: 'Visit sprawling tea estates in Munnar, learn about tea cultivation and processing. Enjoy tea tasting sessions and witness the breathtaking mountain views.',
      price: 1200,
      duration: 4,
      maxParticipants: 15
    },
    {
      title: 'Spice Plantation Walk',
      description: 'Walk through spice gardens and learn about cardamom, pepper, vanilla, and other spices. Understand the spice trade history and medicinal uses.',
      price: 1000,
      duration: 3,
      maxParticipants: 12
    },
    {
      title: 'Eravikulam National Park Trek',
      description: 'Trek through Eravikulam National Park, home to the endangered Nilgiri Tahr. Experience the Western Ghats biodiversity and stunning landscapes.',
      price: 1500,
      duration: 5,
      maxParticipants: 10
    },
    {
      title: 'Traditional Tribal Village Visit',
      description: 'Visit indigenous tribal communities, learn about their culture, traditions, and way of life. Experience their crafts, music, and sustainable living practices.',
      price: 1800,
      duration: 4,
      maxParticipants: 8
    }
  ],
  'Ernakulam': [
    {
      title: 'Fort Kochi Heritage Walk',
      description: 'Explore the colonial heritage of Fort Kochi including Chinese fishing nets, Dutch architecture, Jewish Synagogue, and Portuguese influences. Learn about the spice trade history.',
      price: 1000,
      duration: 3,
      maxParticipants: 15
    },
    {
      title: 'Kerala Folklore Museum Tour',
      description: 'Discover Kerala\'s rich cultural heritage through artifacts, traditional art forms, and interactive exhibits. Learn about festivals, rituals, and ancient traditions.',
      price: 600,
      duration: 2,
      maxParticipants: 20
    },
    {
      title: 'Traditional Kalaripayattu Martial Arts Show',
      description: 'Witness Kalaripayattu, one of the oldest martial arts in the world. Watch demonstrations, learn basic techniques, and understand its philosophy.',
      price: 800,
      duration: 2,
      maxParticipants: 25
    },
    {
      title: 'Cherai Beach & Local Fishing Experience',
      description: 'Experience traditional fishing methods with local fishermen. Learn about marine life, enjoy fresh catch preparation, and relax on pristine beaches.',
      price: 1200,
      duration: 4,
      maxParticipants: 10
    }
  ],
  'Thrissur': [
    {
      title: 'Thrissur Pooram Festival Experience',
      description: 'Witness the grand Thrissur Pooram, one of Kerala\'s most spectacular festivals. Experience the elephant procession, traditional music, and fireworks. (Seasonal)',
      price: 2000,
      duration: 6,
      maxParticipants: 30
    },
    {
      title: 'Vadakkunnathan Temple & Cultural Heritage',
      description: 'Explore the ancient Vadakkunnathan Temple, a masterpiece of Kerala architecture. Learn about temple rituals, architecture, and local legends.',
      price: 600,
      duration: 2,
      maxParticipants: 15
    },
    {
      title: 'Traditional Handloom Weaving Workshop',
      description: 'Learn the art of handloom weaving, a traditional craft of Thrissur. Create your own fabric and understand the intricate patterns and techniques.',
      price: 1500,
      duration: 3,
      maxParticipants: 8
    },
    {
      title: 'Athirappilly Waterfalls & Nature Walk',
      description: 'Visit the majestic Athirappilly Falls, the "Niagara of India". Enjoy nature walks, bird watching, and learn about the local ecosystem.',
      price: 1000,
      duration: 4,
      maxParticipants: 12
    }
  ],
  'Palakkad': [
    {
      title: 'Palakkad Fort & History Tour',
      description: 'Explore the historic Palakkad Fort, built by Hyder Ali. Learn about the region\'s history, architecture, and its role in Kerala\'s past.',
      price: 500,
      duration: 2,
      maxParticipants: 15
    },
    {
      title: 'Silent Valley National Park Trek',
      description: 'Trek through Silent Valley, a pristine rainforest and biodiversity hotspot. Spot rare species, learn about conservation, and experience untouched nature.',
      price: 2000,
      duration: 6,
      maxParticipants: 8
    },
    {
      title: 'Traditional Rice Cultivation Experience',
      description: 'Participate in traditional paddy cultivation methods. Learn about organic farming, water management, and the agricultural calendar of Kerala.',
      price: 1200,
      duration: 4,
      maxParticipants: 10
    },
    {
      title: 'Malayalam Literature & Folklore Session',
      description: 'Dive into Malayalam literature, poetry, and folklore. Learn about famous writers, traditional stories, and the evolution of Malayalam language.',
      price: 800,
      duration: 2,
      maxParticipants: 15
    }
  ],
  'Malappuram': [
    {
      title: 'Kadalundi Bird Sanctuary Tour',
      description: 'Explore Kadalundi Bird Sanctuary, home to over 100 bird species. Witness migratory birds, learn about wetland ecosystems, and enjoy bird watching.',
      price: 800,
      duration: 3,
      maxParticipants: 12
    },
    {
      title: 'Traditional Mappila Cuisine Cooking Class',
      description: 'Learn to cook authentic Mappila (Muslim) cuisine including biryani, pathiri, and traditional sweets. Understand the unique blend of Arab and Kerala flavors.',
      price: 1500,
      duration: 3,
      maxParticipants: 8
    },
    {
      title: 'Nilambur Teak Museum & Forest Walk',
      description: 'Visit the world\'s first teak museum, learn about teak cultivation, and explore the surrounding forests. Understand the importance of sustainable forestry.',
      price: 1000,
      duration: 3,
      maxParticipants: 12
    }
  ],
  'Kozhikode': [
    {
      title: 'Kozhikode Beach & Local Food Walk',
      description: 'Explore Kozhikode Beach and indulge in a food walk through local markets. Taste authentic Malabar cuisine including halwa, biryani, and seafood.',
      price: 1200,
      duration: 4,
      maxParticipants: 12
    },
    {
      title: 'Traditional Handicraft & Weaving Tour',
      description: 'Visit local handicraft centers and learn about traditional weaving, pottery, and woodwork. Interact with artisans and purchase authentic souvenirs.',
      price: 1000,
      duration: 3,
      maxParticipants: 10
    },
    {
      title: 'Kappad Beach - Vasco da Gama Landing Site',
      description: 'Visit Kappad Beach where Vasco da Gama first landed in India. Learn about the spice trade, colonial history, and the significance of this historic site.',
      price: 600,
      duration: 2,
      maxParticipants: 15
    },
    {
      title: 'Malabar Spice Market Tour',
      description: 'Explore the vibrant spice markets of Kozhikode. Learn about different spices, their uses, and the history of the spice trade in Malabar.',
      price: 800,
      duration: 2,
      maxParticipants: 12
    }
  ],
  'Wayanad': [
    {
      title: 'Wayanad Wildlife Sanctuary Safari',
      description: 'Embark on a wildlife safari in Wayanad Sanctuary. Spot elephants, deer, and various bird species. Learn about conservation and forest ecosystems.',
      price: 1500,
      duration: 4,
      maxParticipants: 12
    },
    {
      title: 'Coffee Plantation Tour & Processing',
      description: 'Visit organic coffee plantations, learn about coffee cultivation, processing, and roasting. Enjoy coffee tasting sessions in the hills.',
      price: 1200,
      duration: 3,
      maxParticipants: 10
    },
    {
      title: 'Edakkal Caves & Ancient Rock Art',
      description: 'Trek to Edakkal Caves and witness 6000-year-old rock carvings. Learn about prehistoric human settlements and the history of Wayanad.',
      price: 1000,
      duration: 4,
      maxParticipants: 12
    },
    {
      title: 'Tribal Village & Organic Farming',
      description: 'Visit indigenous tribal communities, learn about their sustainable farming practices, traditional medicine, and cultural heritage.',
      price: 1500,
      duration: 4,
      maxParticipants: 8
    }
  ],
  'Kannur': [
    {
      title: 'Theyyam Ritual Performance',
      description: 'Witness Theyyam, a unique ritualistic art form of North Kerala. Experience the elaborate costumes, music, and trance performances. Learn about its spiritual significance.',
      price: 1500,
      duration: 4,
      maxParticipants: 20
    },
    {
      title: 'Handloom Weaving & Textile Tour',
      description: 'Explore Kannur\'s famous handloom industry. Visit weaving centers, learn about traditional techniques, and see the creation of beautiful textiles.',
      price: 1000,
      duration: 3,
      maxParticipants: 10
    },
    {
      title: 'St. Angelo Fort & Portuguese History',
      description: 'Visit St. Angelo Fort, a Portuguese fort overlooking the Arabian Sea. Learn about colonial history, maritime trade, and the region\'s strategic importance.',
      price: 600,
      duration: 2,
      maxParticipants: 15
    },
    {
      title: 'Traditional Payyambalam Beach Experience',
      description: 'Enjoy the beautiful Payyambalam Beach, learn about local fishing traditions, and experience authentic Malabar coastal culture.',
      price: 800,
      duration: 3,
      maxParticipants: 12
    }
  ],
  'Kasaragod': [
    {
      title: 'Bekal Fort & Coastal Heritage',
      description: 'Explore Bekal Fort, a 300-year-old fort with stunning sea views. Learn about its history, architecture, and enjoy the scenic coastal landscape.',
      price: 800,
      duration: 3,
      maxParticipants: 15
    },
    {
      title: 'Traditional Tulu Culture Experience',
      description: 'Experience the unique Tulu culture of Kasaragod. Learn about Tulu language, traditions, festivals, and the distinct cultural identity of the region.',
      price: 1200,
      duration: 3,
      maxParticipants: 12
    },
    {
      title: 'Kasaragod Backwater Cruise',
      description: 'Cruise through the serene backwaters of Kasaragod, less explored than other regions. Experience authentic village life and pristine natural beauty.',
      price: 1500,
      duration: 4,
      maxParticipants: 10
    }
  ]
};

// Generate available dates for the next 6 months
function generateAvailableDates() {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 180; i++) { // 6 months
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Skip some dates randomly (80% availability)
    if (Math.random() > 0.2) {
      dates.push({
        date: date,
        startTime: '09:00',
        endTime: '17:00',
        available: true
      });
    }
  }
  
  return dates;
}

async function createKeralaExperiences() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find or create a provider for Kerala experiences
    let provider = await Provider.findOne({ email: 'kerala.experiences@tribelink.com' });
    
    if (!provider) {
      const hashedPassword = await bcrypt.hash('kerala123', 10);
      provider = new Provider({
        email: 'kerala.experiences@tribelink.com',
        phoneNumber: '+919876543210',
        password: hashedPassword,
        name: 'Kerala Authentic Experiences',
        providerType: 'EXPERIENCE_HOST',
        role: 'Host',
        rating: 4.8,
        ratingCount: 50
      });
      await provider.save();
      console.log('✅ Created provider: Kerala Authentic Experiences\n');
    } else {
      console.log('✅ Using existing provider: Kerala Authentic Experiences\n');
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // Create experiences for each district
    for (const district of keralaDistricts) {
      const experiences = districtExperiences[district.name] || [];
      
      console.log(`\n📍 Processing ${district.name} (${experiences.length} experiences)...`);
      
      for (const expData of experiences) {
        try {
          // Check if experience already exists
          const existingExp = await Experience.findOne({
            title: expData.title,
            'location.district': district.name
          });

          if (existingExp) {
            console.log(`  ⏭️  Skipped: ${expData.title} (already exists)`);
            totalSkipped++;
            continue;
          }

          // Create experience
          const experience = new Experience({
            title: expData.title,
            description: expData.description,
            provider: provider._id,
            location: {
              country: 'India',
              state: 'Kerala',
              district: district.name,
              coordinates: {
                lat: district.lat,
                lng: district.lng
              }
            },
            availableDates: generateAvailableDates(),
            price: expData.price,
            duration: expData.duration,
            maxParticipants: expData.maxParticipants,
            averageRating: 4.5 + (Math.random() * 0.5), // Random rating between 4.5-5.0
            reviewCount: Math.floor(Math.random() * 50) + 10 // Random reviews between 10-60
          });

          await experience.save();
          
          // Add experience to provider
          provider.experiences.push(experience._id);
          
          console.log(`  ✅ Created: ${expData.title}`);
          totalCreated++;
        } catch (error) {
          console.error(`  ❌ Error creating ${expData.title}:`, error.message);
        }
      }
    }

    // Save provider with all experiences
    await provider.save();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total experiences created: ${totalCreated}`);
    console.log(`⏭️  Total experiences skipped: ${totalSkipped}`);
    console.log(`📍 Districts covered: ${keralaDistricts.length}`);
    console.log(`👤 Provider: ${provider.name} (${provider.email})`);
    console.log('\n✅ Kerala experiences seeding completed!');
    console.log('\n💡 Login as provider:');
    console.log(`   Email: ${provider.email}`);
    console.log(`   Password: kerala123`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Kerala experiences:', error);
    process.exit(1);
  }
}

// Run the script
createKeralaExperiences();

