const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      default: () => `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    // Support both simple and complex room structures
    roomType: {
      type: String,
      required: function () {
        return !this.rooms || this.rooms.length === 0;
      },
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    // Complex rooms structure for multiple room bookings
    rooms: [
      {
        roomType: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        pricePerNight: {
          type: Number,
          required: true,
        },
      },
    ],
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    // Support both simple and complex guest structures
    numberOfGuests: {
      type: Number,
      required: function () {
        return !this.guests;
      },
      min: 1,
    },
    guests: {
      adults: {
        type: Number,
        min: 1,
        default: 1,
      },
      children: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    guestDetails: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },
    specialRequests: {
      type: String,
      maxlength: 500,
    },
    pricing: {
      roomTotal: {
        type: Number,
        default: 0,
      },
      taxes: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    // Keep backward compatibility
    totalAmount: {
      type: Number,
      required: function () {
        return !this.pricing || !this.pricing.totalAmount;
      },
    },
    payment: {
      method: {
        type: String,
        enum: ["stripe", "razorpay", "card"],
        default: "stripe",
      },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded"],
        default: "pending",
      },
      stripePaymentIntentId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      transactionId: String,
      paidAt: Date,
      failedAt: Date,
      refundId: String,
      refundAmount: Number,
      refundedAt: Date,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "checked-in",
        "checked-out",
        "no-show",
        "payment_failed",
      ],
      default: "pending",
    },
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false,
      },
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      refundAmount: Number,
    },
    notifications: {
      confirmationSent: {
        type: Boolean,
        default: false,
      },
      reminderSent: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ "payment.status": 1 });

// Calculate total amount for the booking
bookingSchema.methods.calculateTotalAmount = function () {
  let roomTotal = 0;

  if (this.rooms && this.rooms.length > 0) {
    // Calculate total for complex room structure
    this.rooms.forEach((room) => {
      roomTotal += room.pricePerNight * room.quantity * this.nights;
    });
  } else if (this.totalAmount) {
    // Use simple totalAmount if provided
    roomTotal = this.totalAmount;
  }

  // Calculate taxes (12% GST)
  const taxes = Math.round(roomTotal * 0.12);

  // Apply discount if any
  const discount = this.pricing?.discount || 0;

  // Calculate final total
  const finalTotal = roomTotal + taxes - discount;

  // Update pricing object
  if (!this.pricing) {
    this.pricing = {};
  }

  this.pricing.roomTotal = roomTotal;
  this.pricing.taxes = taxes;
  this.pricing.discount = discount;
  this.pricing.totalAmount = finalTotal;

  // Keep backward compatibility
  if (!this.totalAmount) {
    this.totalAmount = finalTotal;
  }

  return finalTotal;
};

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const checkInDate = new Date(this.checkIn);
  const timeDiff = checkInDate.getTime() - now.getTime();
  const hoursUntilCheckIn = timeDiff / (1000 * 3600);

  return (
    (this.status === "confirmed" || this.status === "pending") &&
    hoursUntilCheckIn >= 24 &&
    !this.cancellation.isCancelled
  );
};

// Cancel booking method
bookingSchema.methods.cancelBooking = async function (cancelledBy, reason) {
  this.status = "cancelled";
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.reason = reason;

  // Calculate refund amount (example: full refund if cancelled 24+ hours before)
  if (this.canBeCancelled()) {
    this.cancellation.refundAmount =
      this.pricing?.totalAmount || this.totalAmount;
  }

  return this.save();
};

// Get confirmation email content
bookingSchema.methods.getConfirmationEmailContent = function () {
  return {
    bookingId: this.bookingId,
    hotelName: this.hotel.name,
    checkIn: this.checkIn,
    checkOut: this.checkOut,
    nights: this.nights,
    guests: this.guests || { adults: this.numberOfGuests, children: 0 },
    totalAmount: this.pricing?.totalAmount || this.totalAmount,
    status: this.status,
  };
};

// Validate check-in and check-out dates
bookingSchema.pre("save", function (next) {
  if (this.checkIn >= this.checkOut) {
    return next(new Error("Check-out date must be after check-in date"));
  }

  if (this.checkIn < new Date()) {
    return next(new Error("Check-in date cannot be in the past"));
  }

  // Calculate nights if not provided
  if (!this.nights) {
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    this.nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
