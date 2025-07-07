const express = require("express");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Admin Dashboard - Get overview statistics
router.get("/dashboard", authenticate, requireAdmin, async (req, res) => {
  try {
    // Get total counts
    const totalHotels = await Hotel.countDocuments({ isActive: true });
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments({ role: "customer" });

    // Get revenue statistics
    const revenueStats = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.totalAmount" },
          averageBookingValue: { $avg: "$pricing.totalAmount" },
        },
      },
    ]);

    const revenue =
      revenueStats.length > 0
        ? revenueStats[0]
        : { totalRevenue: 0, averageBookingValue: 0 };

    // Get booking statistics by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly revenue for the current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: "confirmed",
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$pricing.totalAmount" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top performing hotels
    const topHotels = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: "$hotel",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.totalAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotel",
        },
      },
      { $unwind: "$hotel" },
      { $match: { "hotel.isActive": true } },
      {
        $project: {
          hotelName: "$hotel.name",
          location: "$hotel.location",
          totalBookings: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate("hotel", "name location")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      message: "Dashboard data retrieved successfully",
      stats: {
        totalHotels,
        totalBookings,
        totalUsers,
        totalRevenue: revenue.totalRevenue,
        averageBookingValue: Math.round(revenue.averageBookingValue || 0),
      },
      bookingsByStatus,
      monthlyRevenue,
      topHotels,
      recentBookings,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

// Hotel Management - Get all hotels
router.get("/hotels", authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, state, featured } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    if (state) {
      query["location.state"] = { $regex: state, $options: "i" };
    }

    if (featured !== undefined && featured !== "") {
      query.featured = featured === "true";
    }

    const hotels = await Hotel.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Hotel.countDocuments(query);

    res.json({
      message: "Hotels retrieved successfully",
      hotels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalHotels: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Hotels fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch hotels",
      error: error.message,
    });
  }
});

// Hotel Management - Get hotel by ID
router.get("/hotels/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("createdBy", "name email");

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    res.json({
      message: "Hotel retrieved successfully",
      hotel,
    });
  } catch (error) {
    console.error("Hotel fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch hotel",
      error: error.message,
    });
  }
});

// Hotel Management - Create new hotel
router.post(
  "/hotels",
  authenticate,
  requireAdmin,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const hotelData = JSON.parse(req.body.hotelData || "{}");

      // Manual validation
      const errors = [];

      if (!hotelData.name || !hotelData.name.trim()) {
        errors.push({ field: "name", message: "Hotel name is required" });
      }

      if (!hotelData.description || !hotelData.description.trim()) {
        errors.push({
          field: "description",
          message: "Description is required",
        });
      }

      if (!hotelData.location?.city || !hotelData.location.city.trim()) {
        errors.push({ field: "location.city", message: "City is required" });
      }

      if (!hotelData.location?.state || !hotelData.location.state.trim()) {
        errors.push({ field: "location.state", message: "State is required" });
      }

      if (!hotelData.location?.address || !hotelData.location.address.trim()) {
        errors.push({
          field: "location.address",
          message: "Address is required",
        });
      }

      if (
        !hotelData.location?.pincode ||
        !/^[0-9]{6}$/.test(hotelData.location.pincode)
      ) {
        errors.push({
          field: "location.pincode",
          message: "Valid 6-digit pincode is required",
        });
      }

      if (
        !hotelData.contact?.phone ||
        !/^[0-9]{10}$/.test(hotelData.contact.phone)
      ) {
        errors.push({
          field: "contact.phone",
          message: "Valid 10-digit phone number is required",
        });
      }

      if (
        !hotelData.contact?.email ||
        !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
          hotelData.contact.email
        )
      ) {
        errors.push({
          field: "contact.email",
          message: "Valid email is required",
        });
      }

      if (
        !hotelData.rooms ||
        !Array.isArray(hotelData.rooms) ||
        hotelData.rooms.length === 0
      ) {
        errors.push({
          field: "rooms",
          message: "At least one room type is required",
        });
      } else {
        hotelData.rooms.forEach((room, index) => {
          if (!room.type) {
            errors.push({
              field: `rooms[${index}].type`,
              message: "Room type is required",
            });
          }
          if (!room.basePrice || isNaN(room.basePrice) || room.basePrice <= 0) {
            errors.push({
              field: `rooms[${index}].basePrice`,
              message: "Valid base price is required",
            });
          }
          if (
            !room.maxOccupancy ||
            isNaN(room.maxOccupancy) ||
            room.maxOccupancy <= 0
          ) {
            errors.push({
              field: `rooms[${index}].maxOccupancy`,
              message: "Valid max occupancy is required",
            });
          }
          if (
            !room.totalRooms ||
            isNaN(room.totalRooms) ||
            room.totalRooms <= 0
          ) {
            errors.push({
              field: `rooms[${index}].totalRooms`,
              message: "Valid total rooms count is required",
            });
          }
          if (
            room.availableRooms === undefined ||
            isNaN(room.availableRooms) ||
            room.availableRooms < 0
          ) {
            errors.push({
              field: `rooms[${index}].availableRooms`,
              message: "Valid available rooms count is required",
            });
          }
          if (!room.description || !room.description.trim()) {
            errors.push({
              field: `rooms[${index}].description`,
              message: "Room description is required",
            });
          }
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors,
        });
      }

      // Process uploaded images
      let mainImage = "";
      let galleryImages = [];

      if (req.files.mainImage && req.files.mainImage[0]) {
        mainImage = `/uploads/${req.files.mainImage[0].filename}`;
      }

      if (req.files.galleryImages) {
        galleryImages = req.files.galleryImages.map(
          (file) => `/uploads/${file.filename}`
        );
      }

      // Create hotel
      const hotel = new Hotel({
        ...hotelData,
        images: {
          main:
            mainImage ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
          gallery:
            galleryImages.length > 0
              ? galleryImages
              : [
                  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                ],
        },
        createdBy: req.user._id,
      });

      await hotel.save();

      res.status(201).json({
        message: "Hotel created successfully",
        hotel,
      });
    } catch (error) {
      console.error("Hotel creation error:", error);
      res.status(500).json({
        message: "Failed to create hotel",
        error: error.message,
      });
    }
  }
);

// Hotel Management - Update hotel
router.put(
  "/hotels/:id",
  authenticate,
  requireAdmin,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const hotel = await Hotel.findOne({ _id: req.params.id, isActive: true });
      if (!hotel) {
        return res.status(404).json({
          message: "Hotel not found",
        });
      }

      const updateData = JSON.parse(req.body.hotelData || "{}");

      // Process uploaded images
      if (req.files.mainImage && req.files.mainImage[0]) {
        updateData.images = { ...hotel.images };
        updateData.images.main = `/uploads/${req.files.mainImage[0].filename}`;
      }

      if (req.files.galleryImages) {
        updateData.images = { ...hotel.images };
        const newGalleryImages = req.files.galleryImages.map(
          (file) => `/uploads/${file.filename}`
        );
        updateData.images.gallery = [
          ...hotel.images.gallery,
          ...newGalleryImages,
        ];
      }

      const updatedHotel = await Hotel.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Hotel updated successfully",
        hotel: updatedHotel,
      });
    } catch (error) {
      console.error("Hotel update error:", error);
      res.status(500).json({
        message: "Failed to update hotel",
        error: error.message,
      });
    }
  }
);

// Hotel Management - Delete hotel
router.delete("/hotels/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.countDocuments({
      hotel: req.params.id,
      status: { $in: ["confirmed", "checked-in"] },
      checkOut: { $gte: new Date() },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        message: `Cannot delete hotel. There are ${activeBookings} active bookings.`,
      });
    }

    // Soft delete - mark as inactive
    hotel.isActive = false;
    await hotel.save();

    res.json({
      message: "Hotel deactivated successfully",
    });
  } catch (error) {
    console.error("Hotel deletion error:", error);
    res.status(500).json({
      message: "Failed to delete hotel",
      error: error.message,
    });
  }
});

// Booking Management - Get all bookings
router.get("/bookings", authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      hotel,
      user,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (hotel) {
      query.hotel = hotel;
    }

    if (user) {
      query.user = user;
    }

    if (startDate && endDate) {
      query.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const bookings = await Booking.find(query)
      .populate("hotel", "name location images")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    // Get booking statistics
    const stats = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$pricing.totalAmount" },
        },
      },
    ]);

    res.json({
      message: "Bookings retrieved successfully",
      bookings,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
});

// Booking Management - Update booking status
router.put(
  "/bookings/:id/status",
  authenticate,
  requireAdmin,
  [
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "cancelled",
        "checked-in",
        "checked-out",
        "no-show",
      ])
      .withMessage("Invalid status"),
    body("reason")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Reason cannot exceed 200 characters"),
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

      const { status, reason } = req.body;

      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      // Update booking status
      booking.status = status;

      if (status === "cancelled") {
        await booking.cancelBooking(req.user._id, reason);
      } else {
        await booking.save();
      }

      // Populate for response
      await booking.populate("hotel", "name location");
      await booking.populate("user", "name email");

      res.json({
        message: `Booking status updated to ${status}`,
        booking,
      });
    } catch (error) {
      console.error("Booking status update error:", error);
      res.status(500).json({
        message: "Failed to update booking status",
        error: error.message,
      });
    }
  }
);

// Analytics - Revenue reports
router.get(
  "/analytics/revenue",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { period = "monthly", year = new Date().getFullYear() } = req.query;

      let groupBy = {};
      let dateRange = {};

      if (period === "daily") {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateRange = { $gte: thirtyDaysAgo };
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
      } else if (period === "monthly") {
        // Current year by month
        dateRange = {
          $gte: new Date(year, 0, 1),
          $lt: new Date(parseInt(year) + 1, 0, 1),
        };
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
      } else if (period === "yearly") {
        // Last 5 years
        groupBy = { year: { $year: "$createdAt" } };
      }

      const revenueData = await Booking.aggregate([
        {
          $match: {
            status: "confirmed",
            createdAt: dateRange,
          },
        },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: "$pricing.totalAmount" },
            bookings: { $sum: 1 },
            averageBookingValue: { $avg: "$pricing.totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        message: "Revenue analytics retrieved successfully",
        period,
        year: parseInt(year),
        data: revenueData,
      });
    } catch (error) {
      console.error("Revenue analytics error:", error);
      res.status(500).json({
        message: "Failed to fetch revenue analytics",
        error: error.message,
      });
    }
  }
);

// Analytics - Hotel performance
router.get(
  "/analytics/hotels",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const hotelPerformance = await Booking.aggregate([
        { $match: { status: "confirmed" } },
        {
          $group: {
            _id: "$hotel",
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.totalAmount" },
            averageBookingValue: { $avg: "$pricing.totalAmount" },
            totalNights: { $sum: "$nights" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: "hotels",
            localField: "_id",
            foreignField: "_id",
            as: "hotel",
          },
        },
        { $unwind: "$hotel" },
        {
          $project: {
            hotelId: "$_id",
            hotelName: "$hotel.name",
            location: "$hotel.location",
            rating: "$hotel.rating",
            totalBookings: 1,
            totalRevenue: 1,
            averageBookingValue: { $round: ["$averageBookingValue", 0] },
            totalNights: 1,
            occupancyRate: {
              $divide: [
                "$totalNights",
                { $multiply: [365, { $sum: "$hotel.rooms.totalRooms" }] },
              ],
            },
          },
        },
      ]);

      res.json({
        message: "Hotel performance analytics retrieved successfully",
        hotels: hotelPerformance,
      });
    } catch (error) {
      console.error("Hotel analytics error:", error);
      res.status(500).json({
        message: "Failed to fetch hotel analytics",
        error: error.message,
      });
    }
  }
);

module.exports = router;
