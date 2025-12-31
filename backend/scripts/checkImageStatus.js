/**
 * Diagnostic script to check image status
 * Shows which images exist in database but files are missing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Experience = require('../models/Experience');
const Hotel = require('../models/Hotel');

const uploadsDir = path.join(__dirname, '../uploads');

async function checkImageStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Check if uploads directory exists
    const uploadsExists = fs.existsSync(uploadsDir);
    console.log(`📁 Uploads directory exists: ${uploadsExists}`);
    
    if (uploadsExists) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`   Files in uploads/: ${files.length}\n`);
    } else {
      console.log(`   ⚠️  Uploads directory does not exist!\n`);
    }

    // Check Experiences
    console.log('🔍 Checking Experiences...');
    const experiences = await Experience.find({ imageUrl: { $exists: true, $ne: null } }).lean();
    console.log(`   Total experiences with imageUrl: ${experiences.length}`);

    let experienceImagesMissing = 0;
    let experienceImagesExist = 0;
    const missingExperienceImages = [];

    for (const exp of experiences) {
      if (exp.imageUrl) {
        // Extract filename from path
        const filename = exp.imageUrl.replace('/uploads/', '');
        const filePath = path.join(uploadsDir, filename);
        const fileExists = fs.existsSync(filePath);

        if (fileExists) {
          experienceImagesExist++;
        } else {
          experienceImagesMissing++;
          missingExperienceImages.push({
            id: exp._id,
            title: exp.title,
            imageUrl: exp.imageUrl,
            filename: filename
          });
        }
      }
    }

    console.log(`   ✅ Images that exist: ${experienceImagesExist}`);
    console.log(`   ❌ Images missing: ${experienceImagesMissing}`);

    if (missingExperienceImages.length > 0) {
      console.log('\n   Missing images:');
      missingExperienceImages.slice(0, 5).forEach(img => {
        console.log(`     - ${img.title}: ${img.imageUrl}`);
      });
      if (missingExperienceImages.length > 5) {
        console.log(`     ... and ${missingExperienceImages.length - 5} more`);
      }
    }

    // Check Hotels
    console.log('\n🔍 Checking Hotels...');
    const hotels = await Hotel.find({ images: { $exists: true, $ne: [] } }).lean();
    console.log(`   Total hotels with images: ${hotels.length}`);

    let hotelImagesMissing = 0;
    let hotelImagesExist = 0;
    const missingHotelImages = [];

    for (const hotel of hotels) {
      if (hotel.images && Array.isArray(hotel.images)) {
        for (const img of hotel.images) {
          if (img.url) {
            const filename = img.url.replace('/uploads/', '');
            const filePath = path.join(uploadsDir, filename);
            const fileExists = fs.existsSync(filePath);

            if (fileExists) {
              hotelImagesExist++;
            } else {
              hotelImagesMissing++;
              missingHotelImages.push({
                hotelId: hotel._id,
                hotelName: hotel.name,
                imageUrl: img.url,
                filename: filename
              });
            }
          }
        }
      }
    }

    console.log(`   ✅ Images that exist: ${hotelImagesExist}`);
    console.log(`   ❌ Images missing: ${hotelImagesMissing}`);

    if (missingHotelImages.length > 0) {
      console.log('\n   Missing images:');
      missingHotelImages.slice(0, 5).forEach(img => {
        console.log(`     - ${img.hotelName}: ${img.imageUrl}`);
      });
      if (missingHotelImages.length > 5) {
        console.log(`     ... and ${missingHotelImages.length - 5} more`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total missing images: ${experienceImagesMissing + hotelImagesMissing}`);
    console.log(`Total existing images: ${experienceImagesExist + hotelImagesExist}`);
    
    if (experienceImagesMissing + hotelImagesMissing > 0) {
      console.log('\n⚠️  ISSUE DETECTED: Images are missing from filesystem!');
      console.log('\n💡 SOLUTIONS:');
      console.log('   1. Re-upload images for affected experiences/hotels');
      console.log('   2. Migrate to cloud storage (AWS S3 or Cloudinary)');
      console.log('   3. Use Render Disk Storage (paid feature)');
    } else {
      console.log('\n✅ All images exist in filesystem!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkImageStatus();

