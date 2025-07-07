const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authenticate user token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify JWT secret is available
    if (!global.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({
        message: "Server configuration error.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, global.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT verification failed:", {
        error: jwtError.name,
        message: jwtError.message,
        token: token.substring(0, 20) + "...", // Log first 20 chars for debugging
      });

      // Send appropriate error message based on JWT error type
      let errorMessage = "Invalid token.";
      if (jwtError.name === "TokenExpiredError") {
        errorMessage = "Token has expired. Please login again.";
      } else if (jwtError.name === "JsonWebTokenError") {
        errorMessage = "Malformed token. Please login again.";
      }

      return res.status(401).json({
        message: errorMessage,
        tokenError: true, // Flag to help frontend handle token cleanup
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      console.error("User not found or inactive:", {
        userId: decoded.userId,
        userExists: !!user,
        isActive: user?.isActive,
      });
      return res.status(401).json({
        message: "Invalid token or user account deactivated.",
        tokenError: true,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", {
      error: error.name,
      message: error.message,
      stack: error.stack,
    });
    res.status(401).json({
      message: "Authentication failed.",
      tokenError: true,
    });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({
      message: "Authorization error.",
    });
  }
};

// Check if user is customer
const requireCustomer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        message: "Access denied. Customer access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Customer authorization error:", error);
    res.status(500).json({
      message: "Authorization error.",
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");

      if (
        token &&
        token !== "null" &&
        token !== "undefined" &&
        global.JWT_SECRET
      ) {
        try {
          const decoded = jwt.verify(token, global.JWT_SECRET);
          const user = await User.findById(decoded.userId).select("-password");

          if (user && user.isActive) {
            req.user = user;
          }
        } catch (jwtError) {
          // Log for debugging but don't fail the request
          console.log("Optional auth - invalid token:", jwtError.name);
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, global.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = {
  authenticate,
  requireAdmin,
  requireCustomer,
  optionalAuth,
  generateToken,
};
