const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📱 Connected to MongoDB");

    // Find user by email
    const adminUser = await User.findOne({ email: "admin@staywise.ai" });

    if (adminUser) {
      // Update existing user to have admin role
      adminUser.role = "admin";
      adminUser.isVerified = true;
      adminUser.isActive = true;
      await adminUser.save();

      console.log("✅ Admin user updated successfully:");
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
    } else {
      // Create new admin user
      const newAdmin = new User({
        name: "Admin User",
        email: "admin@staywise.ai",
        password: "admin123",
        phone: "9999999999",
        role: "admin",
        isVerified: true,
        isActive: true,
      });

      await newAdmin.save();

      console.log("✅ Admin user created successfully!");
      console.log("📧 Email: admin@staywise.ai");
      console.log("🔐 Password: admin123");
    }

    console.log("");
    console.log("🚀 You can now log in to the admin dashboard at /admin");
    console.log("⚠️ Remember to change the password after first login!");
  } catch (error) {
    console.error("❌ Error managing admin user:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📱 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
createAdminUser();
