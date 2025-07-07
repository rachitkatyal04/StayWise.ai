const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { authenticate, generateToken } = require("../middleware/auth");

const router = express.Router();

// User Registration
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Please enter a valid 10-digit phone number"),
    body("role")
      .optional()
      .isIn(["customer", "admin"])
      .withMessage("Role must be either customer or admin"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, email, password, phone, role = "customer" } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email already exists",
        });
      }

      // Check if phone number already exists
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          message: "User with this phone number already exists",
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        role,
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Update last login
      await user.updateLastLogin();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Registration failed",
        error: error.message,
      });
    }
  }
);

// User Login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          message: "Account has been deactivated. Please contact support.",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Generate token
      const token = generateToken(user._id);

      // Update last login
      await user.updateLastLogin();

      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          lastLogin: user.lastLogin,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        message: "Login failed",
        error: error.message,
      });
    }
  }
);

// Get User Profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("bookingHistory")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

// Update User Profile
router.put(
  "/profile",
  authenticate,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("phone")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Please enter a valid 10-digit phone number"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, phone, preferences } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (phone) {
        // Check if phone number already exists for other users
        const existingPhone = await User.findOne({
          phone,
          _id: { $ne: req.user._id },
        });
        if (existingPhone) {
          return res.status(400).json({
            message: "Phone number already exists",
          });
        }
        updateData.phone = phone;
      }
      if (preferences) updateData.preferences = preferences;

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        message: "Failed to update profile",
        error: error.message,
      });
    }
  }
);

// Change Password
router.put(
  "/change-password",
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select("+password");

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        message: "Failed to change password",
        error: error.message,
      });
    }
  }
);

// Verify Token
router.get("/verify", authenticate, (req, res) => {
  res.json({
    message: "Token is valid",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Logout (client-side token removal)
router.post("/logout", authenticate, (req, res) => {
  res.json({
    message: "Logged out successfully",
  });
});

// Get all users (Admin only)
router.get("/users", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};

    if (role && ["customer", "admin"].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

// Update user role (Admin only)
router.put("/users/:id/role", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    const { role } = req.body;

    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'customer' or 'admin'.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("User role update error:", error);
    res.status(500).json({
      message: "Failed to update user role",
      error: error.message,
    });
  }
});

module.exports = router;
