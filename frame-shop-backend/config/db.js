// Secure MongoDB connection with health monitoring and error handling
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mediconnect");

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log("✅ Database connection is healthy");
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
