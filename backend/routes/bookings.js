const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const { authenticate, requireCustomer } = require("../middleware/auth");

const router = express.Router();

// Create a new booking
router.post(
  "/create",
  authenticate,
  requireCustomer,
  [
    body("hotelId").isMongoId().withMessage("Valid hotel ID is required"),
    body("checkIn").isISO8601().withMessage("Valid check-in date is required"),
    body("checkOut")
      .isISO8601()
      .withMessage("Valid check-out date is required"),
    body("rooms")
      .isArray({ min: 1 })
      .withMessage("At least one room is required"),
    body("rooms.*.roomType").notEmpty().withMessage("Room type is required"),
    body("rooms.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Room quantity must be at least 1"),
    body("guests.adults")
      .isInt({ min: 1 })
      .withMessage("At least one adult guest is required"),
    body("guestDetails.firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required"),
    body("guestDetails.lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required"),
    body("guestDetails.email").isEmail().withMessage("Valid email is required"),
    body("guestDetails.phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid 10-digit phone number is required"),
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

      const {
        hotelId,
        checkIn,
        checkOut,
        rooms,
        guests,
        guestDetails,
        specialRequests,
      } = req.body;

      // Validate hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel || !hotel.isActive) {
        return res.status(404).json({
          message: "Hotel not found or not available",
        });
      }

      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          message: "Check-out date must be after check-in date",
        });
      }

      if (checkInDate < new Date()) {
        return res.status(400).json({
          message: "Check-in date cannot be in the past",
        });
      }

      // Check room availability
      const availableRooms = await hotel.getAvailableRooms(
        checkInDate,
        checkOutDate
      );

      // Validate requested rooms are available
      for (const requestedRoom of rooms) {
        const availableRoom = availableRooms.find(
          (ar) => ar.type === requestedRoom.roomType
        );

        if (!availableRoom) {
          return res.status(400).json({
            message: `Room type ${requestedRoom.roomType} not found`,
          });
        }

        if (availableRoom.availableRooms < requestedRoom.quantity) {
          return res.status(400).json({
            message: `Only ${availableRoom.availableRooms} rooms of type ${requestedRoom.roomType} are available`,
          });
        }

        // Add price to room
        requestedRoom.pricePerNight = availableRoom.basePrice;
      }

      // Calculate nights
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Create booking
      const booking = new Booking({
        user: req.user._id,
        hotel: hotelId,
        rooms,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guests,
        guestDetails,
        specialRequests,
        pricing: {
          roomTotal: 0,
          taxes: 0,
          discount: 0,
          totalAmount: 0,
        },
        payment: {
          method: "stripe",
          status: "pending",
        },
      });

      // Calculate pricing
      booking.calculateTotalAmount();

      // Save booking
      await booking.save();

      // Populate hotel information
      await booking.populate("hotel", "name location images contact");
      await booking.populate("user", "name email phone");

      res.status(201).json({
        message: "Booking created successfully",
        booking,
        paymentRequired: true,
      });
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(500).json({
        message: "Failed to create booking",
        error: error.message,
      });
    }
  }
);

// Create a new booking (simplified version)
router.post(
  "/",
  authenticate,
  requireCustomer,
  [
    body("hotelId").isMongoId().withMessage("Valid hotel ID is required"),
    body("roomId")
      .optional()
      .isMongoId()
      .withMessage("Valid room ID is required"),
    body("roomType").notEmpty().withMessage("Room type is required"),
    body("checkIn").isISO8601().withMessage("Valid check-in date is required"),
    body("checkOut")
      .isISO8601()
      .withMessage("Valid check-out date is required"),
    body("numberOfGuests")
      .isInt({ min: 1 })
      .withMessage("At least one guest is required"),
    body("totalAmount")
      .isNumeric()
      .withMessage("Valid total amount is required"),
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

      const {
        hotelId,
        roomId,
        roomType,
        checkIn,
        checkOut,
        numberOfGuests,
        totalAmount,
      } = req.body;

      // Validate hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({
          message: "Hotel not found",
        });
      }

      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          message: "Check-out date must be after check-in date",
        });
      }

      if (checkInDate < new Date()) {
        return res.status(400).json({
          message: "Check-in date cannot be in the past",
        });
      }

      // Create booking
      const booking = new Booking({
        user: req.user._id,
        hotel: hotelId,
        roomType,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfGuests,
        status: "pending",
        totalAmount,
        payment: {
          status: "pending",
        },
      });

      // Save booking
      await booking.save();

      // Populate hotel information
      await booking.populate("hotel", "name location images contact");

      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(500).json({
        message: "Failed to create booking",
        error: error.message,
      });
    }
  }
);

// Get user bookings
router.get("/my-bookings", authenticate, requireCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("hotel", "name location images rating")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      message: "Bookings retrieved successfully",
      bookings,
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

// Alias route for frontend compatibility
router.get("/", authenticate, requireCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("hotel", "name location images rating")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      message: "Bookings retrieved successfully",
      bookings,
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

// Get booking by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hotel", "name location images contact policies")
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Check if user owns this booking or is admin
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Access denied. You can only view your own bookings.",
      });
    }

    res.json({
      message: "Booking retrieved successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
});

// Update booking status (for payment confirmation)
router.put(
  "/:id/status",
  authenticate,
  [
    body("status")
      .isIn(["confirmed", "cancelled"])
      .withMessage("Status must be confirmed or cancelled"),
    body("paymentId")
      .optional()
      .notEmpty()
      .withMessage("Payment ID is required for confirmation"),
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

      const { status, paymentId, transactionId } = req.body;

      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      // Check if user owns this booking or is admin
      if (
        booking.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "Access denied. You can only update your own bookings.",
        });
      }

      // Update booking status
      booking.status = status;

      if (status === "confirmed" && paymentId) {
        booking.payment.status = "completed";
        booking.payment.razorpayPaymentId = paymentId;
        booking.payment.transactionId = transactionId;
        booking.payment.paidAt = new Date();
      }

      await booking.save();

      // Add booking to user's history
      if (status === "confirmed") {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { bookingHistory: booking._id },
        });
      }

      res.json({
        message: `Booking ${status} successfully`,
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

// Cancel booking
router.put(
  "/:id/cancel",
  authenticate,
  [
    body("reason")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Reason cannot exceed 200 characters"),
  ],
  async (req, res) => {
    try {
      const { reason } = req.body;

      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      // Check if user owns this booking or is admin
      if (
        booking.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "Access denied. You can only cancel your own bookings.",
        });
      }

      // Check if booking can be cancelled
      if (!booking.canBeCancelled()) {
        return res.status(400).json({
          message:
            "Booking cannot be cancelled. Cancellation is only allowed 24+ hours before check-in.",
        });
      }

      // Cancel booking
      await booking.cancelBooking(req.user._id, reason);

      res.json({
        message: "Booking cancelled successfully",
        booking,
        refundAmount: booking.cancellation.refundAmount,
      });
    } catch (error) {
      console.error("Booking cancellation error:", error);
      res.status(500).json({
        message: "Failed to cancel booking",
        error: error.message,
      });
    }
  }
);

// Get booking confirmation details
router.get("/:id/confirmation", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hotel", "name location images contact policies")
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Check if user owns this booking or is admin
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Access denied. You can only view your own bookings.",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: "Booking is not confirmed yet",
      });
    }

    // Generate confirmation email content
    const emailContent = booking.getConfirmationEmailContent();

    res.json({
      message: "Booking confirmation retrieved successfully",
      booking,
      emailContent,
      confirmationSent: booking.notifications.confirmationSent,
    });
  } catch (error) {
    console.error("Booking confirmation error:", error);
    res.status(500).json({
      message: "Failed to get booking confirmation",
      error: error.message,
    });
  }
});

// Get booking statistics (for user dashboard)
router.get(
  "/stats/summary",
  authenticate,
  requireCustomer,
  async (req, res) => {
    try {
      const userId = req.user._id;

      // Get booking statistics
      const stats = await Booking.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$pricing.totalAmount" },
          },
        },
      ]);

      // Get recent bookings
      const recentBookings = await Booking.find({ user: userId })
        .populate("hotel", "name location images")
        .sort({ createdAt: -1 })
        .limit(5);

      // Get upcoming bookings
      const upcomingBookings = await Booking.find({
        user: userId,
        status: "confirmed",
        checkIn: { $gte: new Date() },
      })
        .populate("hotel", "name location images")
        .sort({ checkIn: 1 })
        .limit(3);

      // Format statistics
      const formattedStats = {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        pending: 0,
        totalSpent: 0,
      };

      stats.forEach((stat) => {
        formattedStats.total += stat.count;
        formattedStats[stat._id] = stat.count;
        if (stat._id === "confirmed") {
          formattedStats.totalSpent = stat.totalAmount;
        }
      });

      res.json({
        message: "Booking statistics retrieved successfully",
        stats: formattedStats,
        recentBookings,
        upcomingBookings,
      });
    } catch (error) {
      console.error("Booking statistics error:", error);
      res.status(500).json({
        message: "Failed to fetch booking statistics",
        error: error.message,
      });
    }
  }
);

module.exports = router;
