const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\n⚠️  MongoDB is not running. Options:');
    console.log('  1. Start MongoDB: sudo systemctl start mongod');
    console.log('  2. Use MongoDB Atlas: Update MONGODB_URI in .env');
    console.log('  3. Backend will continue but database features will not work\n');
    
    // Set a flag that DB is not connected
    mongoose.connection.readyState = 0;
    return false;
  }
};

module.exports = connectDB;
