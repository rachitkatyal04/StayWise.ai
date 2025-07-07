const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["Single", "Double", "Deluxe", "Suite", "Premium", "Executive"],
  },
  description: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  maxOccupancy: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  amenities: [String],
  images: [String],
  totalRooms: {
    type: Number,
    required: true,
    min: 1,
  },
  availableRooms: {
    type: Number,
    required: true,
    min: 0,
  },
});

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      maxlength: [100, "Hotel name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Hotel description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      country: {
        type: String,
        default: "India",
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^[0-9]{6}$/, "Please enter a valid 6-digit pincode"],
      },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    images: {
      main: {
        type: String,
        required: true,
      },
      gallery: [String],
    },
    rooms: [roomSchema],
    amenities: {
      type: [String],
      default: [],
    },
    policies: {
      checkIn: {
        type: String,
        default: "14:00",
      },
      checkOut: {
        type: String,
        default: "12:00",
      },
      cancellation: {
        type: String,
        default: "Free cancellation up to 24 hours before check-in",
      },
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contact: {
      phone: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
      },
      email: {
        type: String,
        required: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for location-based searches
hotelSchema.index({ "location.city": 1, "location.state": 1 });
hotelSchema.index({ "rating.average": -1 });
hotelSchema.index({ featured: -1 });

// Calculate minimum price for the hotel
hotelSchema.virtual("minPrice").get(function () {
  if (this.rooms && this.rooms.length > 0) {
    return Math.min(...this.rooms.map((room) => room.basePrice));
  }
  return 0;
});

// Update hotel rating when new review is added
hotelSchema.methods.updateRating = function () {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    this.rating.average = Number(
      (totalRating / this.reviews.length).toFixed(1)
    );
    this.rating.count = this.reviews.length;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }
  return this.save();
};

// Get available rooms for specific dates
hotelSchema.methods.getAvailableRooms = async function (checkIn, checkOut) {
  const Booking = mongoose.model("Booking");

  // Find overlapping bookings
  const overlappingBookings = await Booking.find({
    hotel: this._id,
    status: { $in: ["confirmed", "checked-in"] },
    $or: [
      {
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
      },
    ],
  });

  // Calculate available rooms
  const bookedRooms = {};
  overlappingBookings.forEach((booking) => {
    if (booking.rooms && booking.rooms.length > 0) {
      // Handle complex booking structure
      booking.rooms.forEach((room) => {
        if (!bookedRooms[room.roomType]) {
          bookedRooms[room.roomType] = 0;
        }
        bookedRooms[room.roomType] += room.quantity;
      });
    } else if (booking.roomType) {
      // Handle simple booking structure
      if (!bookedRooms[booking.roomType]) {
        bookedRooms[booking.roomType] = 0;
      }
      bookedRooms[booking.roomType] += 1;
    }
  });

  // Return rooms with availability
  return this.rooms.map((room) => ({
    ...room.toObject(),
    availableRooms: room.totalRooms - (bookedRooms[room.type] || 0),
  }));
};

module.exports = mongoose.model("Hotel", hotelSchema);
