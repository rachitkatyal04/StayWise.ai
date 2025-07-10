const mongoose = require("mongoose");

const tripPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    duration: {
      days: { type: Number, required: true, min: 1, max: 30 },
      nights: { type: Number, required: true },
    },
    dates: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    travelers: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    preferences: {
      budget: {
        min: { type: Number, default: 0 },
        max: { type: Number, required: true },
        currency: { type: String, default: "INR" },
      },
      interests: [
        {
          type: String,
          enum: [
            "culture",
            "adventure",
            "relaxation",
            "food",
            "nightlife",
            "nature",
            "shopping",
            "history",
            "spiritual",
            "photography",
          ],
        },
      ],
      travelStyle: {
        type: String,
        enum: [
          "budget",
          "mid-range",
          "luxury",
          "backpacker",
          "family",
          "business",
          "romantic",
        ],
        default: "mid-range",
      },
      accommodation: {
        type: String,
        enum: ["hotel", "resort", "hostel", "apartment", "guesthouse"],
        default: "hotel",
      },
    },
    itinerary: [
      {
        day: { type: Number, required: true },
        date: { type: Date, required: true },
        title: { type: String, required: true },
        description: { type: String },
        accommodation: {
          hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
          hotelName: { type: String },
          checkIn: { type: String },
          checkOut: { type: String },
          roomType: { type: String },
          totalCost: { type: Number, default: 0 },
        },
        activities: [
          {
            time: { type: String },
            duration: { type: Number },
            title: { type: String, required: true },
            description: { type: String },
            category: {
              type: String,
              enum: [
                "sightseeing",
                "food",
                "shopping",
                "adventure",
                "culture",
                "relaxation",
                "transport",
                "experience",
              ],
            },
            location: {
              name: { type: String },
              address: { type: String },
              coordinates: {
                latitude: { type: Number },
                longitude: { type: Number },
              },
            },
            estimatedCost: { type: Number, default: 0 },
            bookingRequired: { type: Boolean, default: false },
            tips: [String],
            rating: { type: Number, min: 0, max: 5 },
          },
        ],
        meals: [
          {
            type: {
              type: String,
              enum: ["breakfast", "lunch", "dinner", "snack"],
            },
            restaurant: { type: String },
            cuisine: { type: String },
            cost: { type: Number, default: 0 },
            description: { type: String },
          },
        ],
        totalDayCost: { type: Number, default: 0 },
        notes: { type: String },
        highlights: [String],
      },
    ],
    summary: {
      totalCost: { type: Number, default: 0 },
      accommodationCost: { type: Number, default: 0 },
      activitiesCost: { type: Number, default: 0 },
      foodCost: { type: Number, default: 0 },
      transportationCost: { type: Number, default: 0 },
      aiConfidenceScore: { type: Number, default: 0, min: 0, max: 100 },
      highlights: [String],
      tips: [String],
      bestTimeToVisit: { type: String },
      weatherInfo: { type: String },
    },
    aiGenerated: {
      model: { type: String, default: "gemini-pro" },
      generatedAt: { type: Date, default: Date.now },
      prompt: { type: String },
      responseTime: { type: Number },
      tokensUsed: { type: Number },
    },
    status: {
      type: String,
      enum: [
        "draft",
        "generated",
        "customized",
        "booked",
        "completed",
        "cancelled",
      ],
      default: "draft",
    },
    userFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      helpful: { type: Boolean },
      improvements: [String],
      wouldRecommend: { type: Boolean },
    },
    bookings: [
      {
        type: { type: String, enum: ["hotel", "activity", "transport"] },
        referenceId: { type: String },
        status: { type: String, enum: ["pending", "confirmed", "cancelled"] },
        cost: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
tripPlanSchema.index({ user: 1, createdAt: -1 });
tripPlanSchema.index({ "destination.city": 1 });
tripPlanSchema.index({ status: 1 });
tripPlanSchema.index({ "dates.startDate": 1 });

// Virtual for trip duration in readable format
tripPlanSchema.virtual("durationText").get(function () {
  return `${
    this.duration.days
  } day${this.duration.days > 1 ? "s" : ""}, ${this.duration.nights} night${this.duration.nights > 1 ? "s" : ""}`;
});

// Method to calculate total cost
tripPlanSchema.methods.calculateTotalCost = function () {
  const totalCost = this.itinerary.reduce(
    (sum, day) => sum + (day.totalDayCost || 0),
    0
  );
  this.summary.totalCost = totalCost;
  return totalCost;
};

// Method to update status
tripPlanSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model("TripPlan", tripPlanSchema);
