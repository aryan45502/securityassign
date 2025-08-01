const mongoose = require("mongoose");
const User = require("./models/User");
const passwordUtils = require("./utils/passwordUtils");
require("dotenv").config({ path: "./config.env" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mediconnect");
    console.log("✅ MongoDB Connected for admin creation");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    const adminData = {
      name: "MediConnect Admin",
      email: "admin@mediconnect.com",
      phone: "1234567890",
      password: "Admin@123456",
      role: "admin",
      isVerified: true,
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("⚠️ Admin user already exists:", adminData.email);
      return;
    }

    // Hash password
    const hashedPassword = await passwordUtils.hashPassword(adminData.password);

    // Create admin user
    const admin = new User({
      ...adminData,
      password: hashedPassword,
      passwordHistory: [{
        password: hashedPassword,
        changedAt: new Date()
      }],
      passwordChangedAt: new Date(),
      passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", adminData.email);
    console.log("🔑 Password:", adminData.password);
    console.log("👤 Role:", adminData.role);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

// Run the script
connectDB().then(() => {
  createAdmin();
}); 