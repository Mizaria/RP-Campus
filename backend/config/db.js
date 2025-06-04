const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      heartbeatFrequencyMS: 2000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle MongoDB connection errors after initial connection
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('MongoDB Connection Error:');
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Name: ${error.name}`);
    console.error('Full Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;