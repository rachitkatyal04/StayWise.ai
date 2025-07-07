const mongoose = require("mongoose");

const UserBehaviorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Search History
    searches: [
      {
        query: {
          destination: String,
          checkIn: Date,
          checkOut: Date,
          guests: Number,
          priceRange: {
            min: Number,
            max: Number,
          },
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        resultsFound: Number,
      },
    ],

    // Hotel Views & Interactions
    hotelViews: [
      {
        hotel: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hotel",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        duration: Number, // in seconds
        actions: [
          {
            type: {
              type: String,
              enum: [
                "view_details",
                "view_images",
                "check_amenities",
                "view_reviews",
              ],
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    // Booking Patterns
    bookingPatterns: {
      preferredSeasons: [
        {
          season: {
            type: String,
            enum: ["spring", "summer", "autumn", "winter"],
          },
          count: {
            type: Number,
            default: 0,
          },
        },
      ],
      preferredLocations: [
        {
          city: String,
          state: String,
          count: {
            type: Number,
            default: 0,
          },
        },
      ],
      preferredPriceRange: {
        min: {
          type: Number,
          default: 0,
        },
        max: {
          type: Number,
          default: 50000,
        },
      },
      preferredAmenities: [
        {
          amenity: String,
          weight: {
            type: Number,
            default: 1,
          },
        },
      ],
      averageStayDuration: {
        type: Number,
        default: 1,
      },
      preferredRoomTypes: [
        {
          roomType: String,
          count: {
            type: Number,
            default: 0,
          },
        },
      ],
    },

    // Preferences derived from AI analysis
    aiPreferences: {
      travelStyle: {
        type: String,
        enum: [
          "luxury",
          "budget",
          "mid-range",
          "adventure",
          "business",
          "family",
          "romantic",
        ],
        default: "mid-range",
      },
      locationPreference: {
        type: String,
        enum: [
          "city-center",
          "beach",
          "mountains",
          "countryside",
          "airport-nearby",
        ],
        default: "city-center",
      },
      loyaltyScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      discoveryScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },

    // Recommendation Feedback
    recommendationFeedback: [
      {
        hotel: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hotel",
        },
        recommended: {
          type: Boolean,
          default: true,
        },
        clicked: {
          type: Boolean,
          default: false,
        },
        booked: {
          type: Boolean,
          default: false,
        },
        feedback: {
          type: String,
          enum: ["liked", "disliked", "irrelevant", "perfect"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
UserBehaviorSchema.index({ user: 1 });
UserBehaviorSchema.index({ "searches.timestamp": -1 });
UserBehaviorSchema.index({ "hotelViews.timestamp": -1 });

// Methods for updating user behavior
UserBehaviorSchema.methods.addSearch = function (searchQuery) {
  this.searches.unshift({
    query: searchQuery,
    timestamp: new Date(),
  });

  // Keep only last 50 searches
  if (this.searches.length > 50) {
    this.searches = this.searches.slice(0, 50);
  }

  return this.save();
};

UserBehaviorSchema.methods.addHotelView = function (hotelId, duration = 0) {
  this.hotelViews.unshift({
    hotel: hotelId,
    timestamp: new Date(),
    duration,
  });

  // Keep only last 100 views
  if (this.hotelViews.length > 100) {
    this.hotelViews = this.hotelViews.slice(0, 100);
  }

  return this.save();
};

UserBehaviorSchema.methods.updateBookingPatterns = function (booking) {
  const checkInDate = new Date(booking.checkIn);
  const month = checkInDate.getMonth();

  // Determine season
  let season;
  if (month >= 2 && month <= 4) season = "spring";
  else if (month >= 5 && month <= 7) season = "summer";
  else if (month >= 8 && month <= 10) season = "autumn";
  else season = "winter";

  // Update preferred seasons
  const seasonIndex = this.bookingPatterns.preferredSeasons.findIndex(
    (s) => s.season === season
  );
  if (seasonIndex > -1) {
    this.bookingPatterns.preferredSeasons[seasonIndex].count++;
  } else {
    this.bookingPatterns.preferredSeasons.push({ season, count: 1 });
  }

  // Update preferred locations
  if (booking.hotel && booking.hotel.location) {
    const locationIndex = this.bookingPatterns.preferredLocations.findIndex(
      (l) =>
        l.city === booking.hotel.location.city &&
        l.state === booking.hotel.location.state
    );
    if (locationIndex > -1) {
      this.bookingPatterns.preferredLocations[locationIndex].count++;
    } else {
      this.bookingPatterns.preferredLocations.push({
        city: booking.hotel.location.city,
        state: booking.hotel.location.state,
        count: 1,
      });
    }
  }

  // Update average stay duration
  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) /
      (1000 * 60 * 60 * 24)
  );
  this.bookingPatterns.averageStayDuration = Math.round(
    (this.bookingPatterns.averageStayDuration + nights) / 2
  );

  return this.save();
};

module.exports = mongoose.model("UserBehavior", UserBehaviorSchema);
