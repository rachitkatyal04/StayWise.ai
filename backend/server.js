require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Import routes
const authRoutes = require("./routes/auth");
const hotelRoutes = require("./routes/hotels");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const recommendationRoutes = require("./routes/recommendations");

const app = express();

// Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  console.error("Please set MONGODB_URI in your .env file");
  process.exit(1);
}
const JWT_SECRET =
  process.env.JWT_SECRET || "staywise_jwt_secret_key_2024_secure_token";

// Make JWT_SECRET available globally for routes
global.JWT_SECRET = JWT_SECRET;

// Log JWT configuration status (without exposing the secret)
console.log(`🔐 JWT Secret configured: ${JWT_SECRET ? "Yes" : "No"}`);
console.log(
  `🔑 Using ${process.env.JWT_SECRET ? "environment" : "default"} JWT secret`
);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB - StayWise Database");
    console.log("🏨 Database ready for hotel bookings!");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "StayWise.ai API is running successfully!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to StayWise.ai API!",
    documentation: "/api/health",
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 StayWise.ai Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💾 Database: Connected to MongoDB`);
});
