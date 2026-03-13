/**
 * Kerala Hotels Seeder
 * 
 * This script creates authentic Kerala hotels for all 14 districts of Kerala.
 * Each district gets 3-5 hotels of different categories (budget, mid-range, luxury, heritage, resorts).
 * 
 * Usage: node backend/scripts/seedKeralaHotels.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hotel = require('../models/Hotel');
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

// Hotel categories and their typical amenities
const hotelCategories = {
  budget: {
    amenities: ['WiFi', 'Parking', 'Air Conditioning'],
    priceRange: { min: 800, max: 2000 },
    roomRange: { min: 10, max: 25 }
  },
  midRange: {
    amenities: ['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'Breakfast', 'Room Service'],
    priceRange: { min: 2000, max: 5000 },
    roomRange: { min: 20, max: 50 }
  },
  luxury: {
    amenities: ['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Air Conditioning', 'Room Service', 'Elevator', 'Spa', 'Restaurant'],
    priceRange: { min: 5000, max: 15000 },
    roomRange: { min: 30, max: 100 }
  },
  heritage: {
    amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Breakfast', 'Room Service'],
    priceRange: { min: 3000, max: 8000 },
    roomRange: { min: 15, max: 40 }
  },
  resort: {
    amenities: ['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Air Conditioning', 'Room Service', 'Spa', 'Restaurant', 'Beach Access'],
    priceRange: { min: 4000, max: 12000 },
    roomRange: { min: 25, max: 80 }
  }
};

// Authentic Kerala hotels by district
const districtHotels = {
  'Thiruvananthapuram': [
    {
      name: 'Heritage Palace Hotel',
      category: 'heritage',
      description: 'A beautifully restored heritage property in the heart of Thiruvananthapuram, offering traditional Kerala architecture with modern amenities. Close to Padmanabhaswamy Temple and major attractions.',
      address: 'MG Road, Thiruvananthapuram'
    },
    {
      name: 'Kovalam Beach Resort',
      category: 'resort',
      description: 'Beachfront resort with stunning views of the Arabian Sea. Features traditional Kerala-style cottages, Ayurvedic spa, and authentic seafood restaurant.',
      address: 'Kovalam Beach Road, Thiruvananthapuram'
    },
    {
      name: 'City Center Budget Stay',
      category: 'budget',
      description: 'Clean and comfortable budget hotel in the city center. Perfect for travelers looking for affordable accommodation with basic amenities.',
      address: 'Thampanoor, Thiruvananthapuram'
    },
    {
      name: 'Luxury Grand Hotel',
      category: 'luxury',
      description: '5-star luxury hotel with world-class facilities, multiple dining options, spa, and conference facilities. Ideal for business and leisure travelers.',
      address: 'Vellayambalam, Thiruvananthapuram'
    }
  ],
  'Kollam': [
    {
      name: 'Ashtamudi Backwater Resort',
      category: 'resort',
      description: 'Serene backwater resort on the banks of Ashtamudi Lake. Traditional Kerala architecture with houseboat stays and authentic local cuisine.',
      address: 'Ashtamudi Lake, Kollam'
    },
    {
      name: 'Beach View Hotel',
      category: 'midRange',
      description: 'Mid-range hotel with beautiful beach views. Features comfortable rooms, restaurant serving local delicacies, and easy access to Thangassery Lighthouse.',
      address: 'Thangassery, Kollam'
    },
    {
      name: 'City Budget Inn',
      category: 'budget',
      description: 'Affordable accommodation in Kollam city center. Clean rooms, friendly staff, and convenient location for exploring the district.',
      address: 'Kollam City Center'
    }
  ],
  'Pathanamthitta': [
    {
      name: 'Periyar Wildlife Resort',
      category: 'resort',
      description: 'Eco-resort near Periyar Tiger Reserve. Perfect for wildlife enthusiasts with guided safari tours and nature walks.',
      address: 'Thekkady, Pathanamthitta'
    },
    {
      name: 'Sabarimala Pilgrim Lodge',
      category: 'midRange',
      description: 'Comfortable accommodation for pilgrims visiting Sabarimala. Clean rooms, vegetarian restaurant, and spiritual atmosphere.',
      address: 'Pamba, Pathanamthitta'
    },
    {
      name: 'Hill Station Hotel',
      category: 'midRange',
      description: 'Mountain view hotel in the hills of Pathanamthitta. Cool climate, scenic views, and traditional Kerala hospitality.',
      address: 'Gavi, Pathanamthitta'
    }
  ],
  'Alappuzha': [
    {
      name: 'Premium Houseboat Resort',
      category: 'luxury',
      description: 'Luxury houseboat resort in the heart of Alleppey backwaters. Private houseboats with modern amenities, personal chef, and butler service.',
      address: 'Vembanad Lake, Alappuzha'
    },
    {
      name: 'Backwater Heritage Resort',
      category: 'heritage',
      description: 'Heritage resort with traditional Kerala architecture overlooking the backwaters. Features Ayurvedic spa and authentic Kerala cuisine.',
      address: 'Alleppey Backwaters, Alappuzha'
    },
    {
      name: 'Beachside Budget Hotel',
      category: 'budget',
      description: 'Budget-friendly hotel near Alappuzha Beach. Clean rooms, basic amenities, and easy access to backwater tours.',
      address: 'Alappuzha Beach Road'
    },
    {
      name: 'Kuttanad Farm Stay',
      category: 'midRange',
      description: 'Unique farm stay experience in Kuttanad, the rice bowl of Kerala. Experience paddy cultivation and authentic village life.',
      address: 'Kuttanad, Alappuzha'
    }
  ],
  'Kottayam': [
    {
      name: 'Kumarakom Lake Resort',
      category: 'resort',
      description: 'Luxury resort on the banks of Vembanad Lake. Features traditional Kerala villas, bird watching tours, and backwater cruises.',
      address: 'Kumarakom, Kottayam'
    },
    {
      name: 'City Business Hotel',
      category: 'midRange',
      description: 'Modern business hotel in Kottayam city. Well-equipped rooms, conference facilities, and multi-cuisine restaurant.',
      address: 'Kottayam City Center'
    },
    {
      name: 'Budget Stay Inn',
      category: 'budget',
      description: 'Affordable hotel with clean rooms and basic amenities. Perfect for budget travelers exploring Kottayam and nearby attractions.',
      address: 'Kottayam Town'
    }
  ],
  'Idukki': [
    {
      name: 'Munnar Tea Estate Resort',
      category: 'resort',
      description: 'Luxury resort in the middle of tea plantations. Breathtaking mountain views, tea tasting sessions, and guided plantation tours.',
      address: 'Munnar, Idukki'
    },
    {
      name: 'Hill Station Heritage Hotel',
      category: 'heritage',
      description: 'Heritage bungalow converted into a hotel, originally built by British planters. Offers colonial charm with modern comforts.',
      address: 'Munnar Hills, Idukki'
    },
    {
      name: 'Eco Mountain Resort',
      category: 'midRange',
      description: 'Eco-friendly resort in the Western Ghats. Perfect for nature lovers with trekking, bird watching, and spice plantation tours.',
      address: 'Thekkady, Idukki'
    },
    {
      name: 'Budget Hill Stay',
      category: 'budget',
      description: 'Affordable accommodation in the hills of Idukki. Cool climate, scenic views, and access to major tourist attractions.',
      address: 'Idukki Town'
    }
  ],
  'Ernakulam': [
    {
      name: 'Fort Kochi Heritage Hotel',
      category: 'heritage',
      description: 'Beautifully restored heritage hotel in Fort Kochi. Features colonial architecture, art galleries, and proximity to Chinese fishing nets.',
      address: 'Fort Kochi, Ernakulam'
    },
    {
      name: 'Marine Drive Luxury Hotel',
      category: 'luxury',
      description: '5-star luxury hotel on Marine Drive with stunning harbor views. World-class amenities, fine dining, and business facilities.',
      address: 'Marine Drive, Ernakulam'
    },
    {
      name: 'City Center Business Hotel',
      category: 'midRange',
      description: 'Modern business hotel in the heart of Kochi. Comfortable rooms, conference facilities, and easy access to business districts.',
      address: 'MG Road, Ernakulam'
    },
    {
      name: 'Budget Backpacker Hostel',
      category: 'budget',
      description: 'Budget-friendly hostel for backpackers. Dormitory and private rooms, common kitchen, and social atmosphere.',
      address: 'Ernakulam South'
    }
  ],
  'Thrissur': [
    {
      name: 'Pooram Heritage Hotel',
      category: 'heritage',
      description: 'Heritage hotel near Vadakkunnathan Temple. Traditional architecture, cultural performances, and perfect location for Thrissur Pooram festival.',
      address: 'Thekkinkadu Maidan, Thrissur'
    },
    {
      name: 'City Luxury Hotel',
      category: 'luxury',
      description: 'Luxury hotel in Thrissur city with modern amenities. Multiple restaurants, spa, and conference facilities.',
      address: 'Thrissur City Center'
    },
    {
      name: 'Budget Tourist Hotel',
      category: 'budget',
      description: 'Affordable hotel for tourists. Clean rooms, friendly staff, and convenient location for exploring Thrissur\'s cultural attractions.',
      address: 'Thrissur Town'
    }
  ],
  'Palakkad': [
    {
      name: 'Palakkad Fort Heritage Hotel',
      category: 'heritage',
      description: 'Heritage hotel near Palakkad Fort. Traditional Kerala architecture with modern amenities, close to historical sites.',
      address: 'Near Palakkad Fort'
    },
    {
      name: 'Silent Valley Resort',
      category: 'resort',
      description: 'Eco-resort near Silent Valley National Park. Perfect for nature enthusiasts with guided treks and wildlife watching.',
      address: 'Mukundapuram, Palakkad'
    },
    {
      name: 'City Budget Hotel',
      category: 'budget',
      description: 'Budget accommodation in Palakkad city. Basic amenities, clean rooms, and convenient for business and leisure travelers.',
      address: 'Palakkad City'
    }
  ],
  'Malappuram': [
    {
      name: 'Kadalundi Bird Sanctuary Resort',
      category: 'resort',
      description: 'Resort near Kadalundi Bird Sanctuary. Perfect for bird watchers with guided tours and nature walks.',
      address: 'Kadalundi, Malappuram'
    },
    {
      name: 'Heritage Mappila Hotel',
      category: 'heritage',
      description: 'Heritage hotel showcasing Mappila (Muslim) culture. Traditional architecture, authentic Mappila cuisine, and cultural programs.',
      address: 'Malappuram Town'
    },
    {
      name: 'Budget Stay Hotel',
      category: 'budget',
      description: 'Affordable hotel in Malappuram. Clean rooms, basic amenities, and friendly service.',
      address: 'Malappuram City'
    }
  ],
  'Kozhikode': [
    {
      name: 'Beach Luxury Resort',
      category: 'luxury',
      description: 'Luxury beachfront resort on Kozhikode Beach. Private beach access, spa, multiple dining options, and stunning sunset views.',
      address: 'Kozhikode Beach, Calicut'
    },
    {
      name: 'Heritage Malabar Hotel',
      category: 'heritage',
      description: 'Heritage hotel showcasing Malabar culture. Traditional architecture, authentic Malabar cuisine, and cultural experiences.',
      address: 'Kozhikode City Center'
    },
    {
      name: 'Spice Market Hotel',
      category: 'midRange',
      description: 'Mid-range hotel near the famous spice markets. Comfortable rooms, restaurant serving local delicacies, and easy market access.',
      address: 'Near Spice Market, Kozhikode'
    },
    {
      name: 'Budget Beach Hotel',
      category: 'budget',
      description: 'Budget hotel near Kozhikode Beach. Clean rooms, basic amenities, and walking distance to beach and local markets.',
      address: 'Kozhikode Beach Road'
    }
  ],
  'Wayanad': [
    {
      name: 'Coffee Plantation Resort',
      category: 'resort',
      description: 'Luxury resort in the middle of coffee plantations. Breathtaking views, coffee tasting, plantation tours, and nature activities.',
      address: 'Kalpetta, Wayanad'
    },
    {
      name: 'Wildlife Safari Resort',
      category: 'resort',
      description: 'Resort near Wayanad Wildlife Sanctuary. Guided safaris, trekking, and wildlife watching experiences.',
      address: 'Sultan Bathery, Wayanad'
    },
    {
      name: 'Hill Station Budget Hotel',
      category: 'budget',
      description: 'Affordable accommodation in the hills of Wayanad. Cool climate, scenic views, and access to major attractions.',
      address: 'Wayanad Hills'
    },
    {
      name: 'Eco Mountain Lodge',
      category: 'midRange',
      description: 'Eco-friendly lodge in Wayanad. Perfect for nature lovers with trekking, bird watching, and tribal village visits.',
      address: 'Vythiri, Wayanad'
    }
  ],
  'Kannur': [
    {
      name: 'Theyyam Heritage Resort',
      category: 'heritage',
      description: 'Heritage resort showcasing Theyyam culture. Traditional architecture, Theyyam performances, and cultural immersion experiences.',
      address: 'Kannur City'
    },
    {
      name: 'Beach Luxury Hotel',
      category: 'luxury',
      description: 'Luxury beachfront hotel on Payyambalam Beach. Private beach access, spa, fine dining, and stunning ocean views.',
      address: 'Payyambalam Beach, Kannur'
    },
    {
      name: 'Handloom Heritage Hotel',
      category: 'heritage',
      description: 'Heritage hotel near handloom centers. Features traditional architecture and handloom weaving demonstrations.',
      address: 'Kannur Handloom Area'
    },
    {
      name: 'Budget Beach Hotel',
      category: 'budget',
      description: 'Budget hotel near Kannur beaches. Clean rooms, basic amenities, and easy access to beaches and local attractions.',
      address: 'Kannur Beach Road'
    }
  ],
  'Kasaragod': [
    {
      name: 'Bekal Fort Resort',
      category: 'resort',
      description: 'Luxury resort near Bekal Fort with stunning sea views. Beach access, spa, and proximity to the historic fort.',
      address: 'Bekal, Kasaragod'
    },
    {
      name: 'Backwater Heritage Hotel',
      category: 'heritage',
      description: 'Heritage hotel on the backwaters of Kasaragod. Traditional architecture, authentic cuisine, and serene atmosphere.',
      address: 'Kasaragod Backwaters'
    },
    {
      name: 'Budget Coastal Hotel',
      category: 'budget',
      description: 'Affordable hotel on the coast of Kasaragod. Clean rooms, basic amenities, and proximity to beaches and Bekal Fort.',
      address: 'Kasaragod Town'
    }
  ]
};

// Generate availability for the next 6 months
function generateAvailability(totalRooms) {
  const availability = [];
  const today = new Date();
  
  for (let i = 0; i < 180; i++) { // 6 months
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Random availability (70-100% of rooms available)
    const availableRooms = Math.floor(totalRooms * (0.7 + Math.random() * 0.3));
    
    availability.push({
      date: date,
      roomsAvailable: availableRooms
    });
  }
  
  return availability;
}

// Generate phone number
function generatePhoneNumber() {
  const prefixes = ['9846', '9847', '9495', '9446', '9447', '9895', '9896'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `+91${prefix}${suffix}`;
}

async function createKeralaHotels() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find or create a provider for Kerala hotels
    let provider = await Provider.findOne({ email: 'kerala.hotels@triberoutes.com' });
    
    if (!provider) {
      const hashedPassword = await bcrypt.hash('kerala123', 10);
      provider = new Provider({
        email: 'kerala.hotels@triberoutes.com',
        phoneNumber: '+919876543211',
        password: hashedPassword,
        name: 'Kerala Hotels & Resorts',
        providerType: 'ACCOMMODATION_PROVIDER',
        rating: 4.7,
        ratingCount: 100
      });
      await provider.save();
      console.log('✅ Created provider: Kerala Hotels & Resorts\n');
    } else {
      console.log('✅ Using existing provider: Kerala Hotels & Resorts\n');
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // Create hotels for each district
    for (const district of keralaDistricts) {
      const hotels = districtHotels[district.name] || [];
      
      console.log(`\n📍 Processing ${district.name} (${hotels.length} hotels)...`);
      
      for (const hotelData of hotels) {
        try {
          // Check if hotel already exists
          const existingHotel = await Hotel.findOne({
            name: hotelData.name,
            'location.district': district.name
          });

          if (existingHotel) {
            console.log(`  ⏭️  Skipped: ${hotelData.name} (already exists)`);
            totalSkipped++;
            continue;
          }

          // Get category details
          const category = hotelCategories[hotelData.category];
          const priceRange = category.priceRange;
          const roomRange = category.roomRange;
          
          // Generate random values within ranges
          const totalRooms = Math.floor(roomRange.min + Math.random() * (roomRange.max - roomRange.min));
          const roomsAvailable = Math.floor(totalRooms * (0.7 + Math.random() * 0.3));
          const pricePerNight = Math.floor(priceRange.min + Math.random() * (priceRange.max - priceRange.min));
          const rating = 4.0 + (Math.random() * 1.0); // Rating between 4.0-5.0
          const reviewCount = Math.floor(Math.random() * 100) + 20; // Reviews between 20-120

          // Create hotel
          const hotel = new Hotel({
            name: hotelData.name,
            description: hotelData.description,
            images: [], // No images for seed data, can be added later
            amenities: category.amenities,
            location: {
              country: 'India',
              state: 'Kerala',
              district: district.name,
              address: hotelData.address,
              coordinates: {
                lat: district.lat + (Math.random() - 0.5) * 0.1, // Slight variation
                lng: district.lng + (Math.random() - 0.5) * 0.1
              }
            },
            totalRooms: totalRooms,
            roomsAvailable: roomsAvailable,
            pricePerNight: pricePerNight,
            rating: rating,
            ratingCount: reviewCount,
            availability: generateAvailability(totalRooms),
            contact: {
              phone: generatePhoneNumber(),
              email: `${hotelData.name.toLowerCase().replace(/\s+/g, '.')}@keralahotels.com`
            },
            policies: {
              checkIn: '14:00',
              checkOut: '11:00',
              cancellationPolicy: 'Free cancellation up to 24 hours before check-in'
            },
            createdBy: provider._id
          });

          await hotel.save();
          
          console.log(`  ✅ Created: ${hotelData.name} (${hotelData.category}, ₹${pricePerNight}/night, ${totalRooms} rooms)`);
          totalCreated++;
        } catch (error) {
          console.error(`  ❌ Error creating ${hotelData.name}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total hotels created: ${totalCreated}`);
    console.log(`⏭️  Total hotels skipped: ${totalSkipped}`);
    console.log(`📍 Districts covered: ${keralaDistricts.length}`);
    console.log(`👤 Provider: ${provider.name} (${provider.email})`);
    console.log('\n✅ Kerala hotels seeding completed!');
    console.log('\n💡 Login as provider:');
    console.log(`   Email: ${provider.email}`);
    console.log(`   Password: kerala123`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Kerala hotels:', error);
    process.exit(1);
  }
}

// Run the script
createKeralaHotels();

