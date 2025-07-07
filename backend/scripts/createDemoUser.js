const mongoose = require("mongoose");
const User = require("../models/User");

// MongoDB connection - load from environment variables
require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  console.error("Please set MONGODB_URI in your .env file");
  process.exit(1);
}

const createDemoUser = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: "user@example.com" });

    if (existingUser) {
      console.log("✅ Demo customer user already exists");
    } else {
      // Create demo customer user
      const demoUser = new User({
        name: "Demo Customer",
        email: "user@example.com",
        phone: "9876543210",
        password: "password123",
        role: "customer",
        isVerified: true,
      });

      await demoUser.save();
      console.log("✅ Demo customer user created successfully");
      console.log("📧 Email: user@example.com");
      console.log("🔑 Password: password123");
    }

    console.log("🎉 Demo user setup completed!");
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
};

// Run the script
createDemoUser();
