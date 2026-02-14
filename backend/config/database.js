const mongoose = require('mongoose');
require('dotenv').config();

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const connectDB = async (retryCount = 0) => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aitourism';
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    // Extract connection details
    const connection = conn.connection;
    const host = connection.host || 'localhost';
    const port = connection.port || 27017;
    const dbName = connection.name || 'aitourism';
    
    console.log(`✅ MongoDB Connected:`);
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Full Connection: ${host}:${port}/${dbName}`);
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Database connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    
    // Retry logic
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`   Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    }
    
    // All retries failed - provide comprehensive troubleshooting
    console.log('\n⚠️  MongoDB connection failed after all retries.');
    console.log('\n📋 Troubleshooting Options:');
    console.log('\n1️⃣  If MongoDB is NOT installed:');
    console.log('   Ubuntu/Debian:');
    console.log('     sudo apt-get update');
    console.log('     sudo apt-get install -y mongodb');
    console.log('   OR use Docker:');
    console.log('     docker run -d -p 27017:27017 --name mongodb mongo:latest');
    console.log('   OR use MongoDB Atlas (cloud - recommended):');
    console.log('     - Sign up at https://www.mongodb.com/cloud/atlas');
    console.log('     - Create a free cluster');
    console.log('     - Get connection string and set MONGODB_URI in .env');
    console.log('\n2️⃣  If MongoDB IS installed but service not found:');
    console.log('   Check service name:');
    console.log('     sudo systemctl list-units | grep mongo');
    console.log('   Try alternative service names:');
    console.log('     sudo systemctl start mongodb');
    console.log('     sudo systemctl start mongod');
    console.log('     sudo service mongodb start');
    console.log('\n3️⃣  Check MongoDB status:');
    console.log('     sudo systemctl status mongod');
    console.log('     sudo systemctl status mongodb');
    console.log('     ps aux | grep mongod');
    console.log('\n4️⃣  Using Docker MongoDB:');
    console.log('     docker ps | grep mongo  # Check if container is running');
    console.log('     docker start mongodb    # Start container if stopped');
    console.log('\n5️⃣  Using MongoDB Atlas:');
    console.log('     - Set MONGODB_URI in .env file');
    console.log('     - Format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
    console.log('\n⚠️  Backend will continue but database features will not work until MongoDB is available.\n');
    
    // Don't try to manually set readyState - it's read-only
    // The connection state will remain disconnected (0) automatically
    return false;
  }
};

module.exports = connectDB;
