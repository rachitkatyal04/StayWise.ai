const express = require("express");
const GeminiTripPlanningAI = require("../services/geminiTripPlanningAI");
const TripPlan = require("../models/TripPlan");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Initialize Gemini AI service
const geminiAI = new GeminiTripPlanningAI();

// Generate new trip plan with Gemini AI
router.post("/generate", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const tripData = req.body;

    // Validate required fields
    if (!tripData.destination?.city || !tripData.destination?.state) {
      return res.status(400).json({
        message: "Destination city and state are required",
        success: false,
      });
    }

    if (
      !tripData.duration?.days ||
      !tripData.dates?.startDate ||
      !tripData.dates?.endDate
    ) {
      return res.status(400).json({
        message: "Duration and dates are required",
        success: false,
      });
    }

    if (!tripData.preferences?.budget?.max) {
      return res.status(400).json({
        message: "Budget maximum is required",
        success: false,
      });
    }

    console.log(
      `🚀 Generating trip plan for user ${userId} to ${tripData.destination.city}`
    );
    console.log(
      "🔍 ROUTE DEBUG - Received tripData:",
      JSON.stringify(tripData, null, 2)
    );
    console.log(
      "🔍 ROUTE DEBUG - Budget from route:",
      tripData.preferences?.budget?.max
    );

    // Generate trip plan using Gemini AI
    const tripPlan = await geminiAI.generateTripPlan(userId, tripData);

    res.json({
      message: "Trip plan generated successfully with AI",
      tripPlan,
      success: true,
      aiGenerated: true,
    });
  } catch (error) {
    console.error("Trip generation error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate trip plan",
      error: error.message,
      success: false,
    });
  }
});

// Get user's trip plans
router.get("/my-trips", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const trips = await TripPlan.find(query)
      .populate("itinerary.accommodation.hotel")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TripPlan.countDocuments(query);

    // Add statistics
    const stats = await TripPlan.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalCost: { $sum: "$summary.totalCost" },
        },
      },
    ]);

    res.json({
      trips,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      stats,
      success: true,
    });
  } catch (error) {
    console.error("Get trips error:", error);
    res.status(500).json({
      message: "Failed to fetch trip plans",
      error: error.message,
      success: false,
    });
  }
});

// Get specific trip plan
router.get("/:tripId", authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    const trip = await TripPlan.findOne({ _id: tripId, user: userId }).populate(
      "itinerary.accommodation.hotel"
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip plan not found",
        success: false,
      });
    }

    res.json({
      trip,
      success: true,
    });
  } catch (error) {
    console.error("Get trip error:", error);
    res.status(500).json({
      message: "Failed to fetch trip plan",
      error: error.message,
      success: false,
    });
  }
});

// Update trip plan
router.put("/:tripId", authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Mark as customized if user modifies AI-generated plan
    if (updates.itinerary || updates.preferences) {
      updates.status = "customized";
    }

    const trip = await TripPlan.findOneAndUpdate(
      { _id: tripId, user: userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).populate("itinerary.accommodation.hotel");

    if (!trip) {
      return res.status(404).json({
        message: "Trip plan not found",
        success: false,
      });
    }

    // Recalculate costs if itinerary was updated
    if (updates.itinerary) {
      trip.calculateTotalCost();
      await trip.save();
    }

    res.json({
      message: "Trip plan updated successfully",
      trip,
      success: true,
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({
      message: "Failed to update trip plan",
      error: error.message,
      success: false,
    });
  }
});

// Delete trip plan
router.delete("/:tripId", authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    const trip = await TripPlan.findOneAndDelete({ _id: tripId, user: userId });

    if (!trip) {
      return res.status(404).json({
        message: "Trip plan not found",
        success: false,
      });
    }

    res.json({
      message: "Trip plan deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({
      message: "Failed to delete trip plan",
      error: error.message,
      success: false,
    });
  }
});

// Submit feedback for trip
router.post("/:tripId/feedback", authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;
    const { rating, comments, helpful, improvements, wouldRecommend } =
      req.body;

    const trip = await TripPlan.findOneAndUpdate(
      { _id: tripId, user: userId },
      {
        userFeedback: {
          rating,
          comments,
          helpful,
          improvements: improvements || [],
          wouldRecommend,
        },
        status: "completed",
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip plan not found",
        success: false,
      });
    }

    res.json({
      message: "Feedback submitted successfully",
      trip,
      success: true,
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      message: "Failed to submit feedback",
      error: error.message,
      success: false,
    });
  }
});

// Regenerate trip plan with different preferences
router.post("/:tripId/regenerate", authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;
    const modifications = req.body;

    // Get existing trip
    const existingTrip = await TripPlan.findOne({ _id: tripId, user: userId });

    if (!existingTrip) {
      return res.status(404).json({
        message: "Trip plan not found",
        success: false,
      });
    }

    // Merge existing data with modifications
    const tripData = {
      destination: modifications.destination || existingTrip.destination,
      duration: modifications.duration || existingTrip.duration,
      dates: modifications.dates || existingTrip.dates,
      travelers: modifications.travelers || existingTrip.travelers,
      preferences: {
        ...existingTrip.preferences,
        ...modifications.preferences,
      },
    };

    // Generate new trip plan
    const newTripPlan = await geminiAI.generateTripPlan(userId, tripData);

    // Mark old plan as cancelled
    existingTrip.status = "cancelled";
    await existingTrip.save();

    res.json({
      message: "Trip plan regenerated successfully",
      tripPlan: newTripPlan,
      success: true,
      previousTripId: tripId,
    });
  } catch (error) {
    console.error("Regenerate trip error:", error);
    res.status(500).json({
      message: "Failed to regenerate trip plan",
      error: error.message,
      success: false,
    });
  }
});

// Get trip planning analytics for admin
router.get("/admin/analytics", authenticate, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin middleware)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }

    const analytics = await TripPlan.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalTrips: { $sum: 1 },
          totalValue: { $sum: "$summary.totalCost" },
          avgBudget: { $avg: "$preferences.budget.max" },
          avgDuration: { $avg: "$duration.days" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    const popularDestinations = await TripPlan.aggregate([
      {
        $group: {
          _id: "$destination.city",
          count: { $sum: 1 },
          avgBudget: { $avg: "$summary.totalCost" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const statusDistribution = await TripPlan.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      analytics,
      popularDestinations,
      statusDistribution,
      success: true,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      message: "Failed to get analytics",
      error: error.message,
      success: false,
    });
  }
});

// Enhanced chatbot endpoint using Gemini
router.post("/chat", authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        message: "Message is required",
        success: false,
      });
    }

    // Get user context for better responses
    const userContext = await geminiAI.getUserContext(userId);

    // Generate AI response
    const aiResponse = await geminiAI.generateChatResponse(
      message,
      userContext
    );

    res.json({
      response: aiResponse,
      success: true,
      aiGenerated: true,
    });
  } catch (error) {
    console.error("Chat error:", error);
    // Fallback to default response
    res.json({
      response:
        "I'm here to help you plan amazing trips! Try asking me about destinations, budgets, or use our AI Trip Planner for detailed itineraries.",
      success: true,
      aiGenerated: false,
    });
  }
});

// Export popular destinations for quick planning
router.get("/destinations/popular", async (req, res) => {
  try {
    const popularDestinations = await TripPlan.aggregate([
      {
        $group: {
          _id: {
            city: "$destination.city",
            state: "$destination.state",
          },
          count: { $sum: 1 },
          avgBudget: { $avg: "$summary.totalCost" },
          avgDuration: { $avg: "$duration.days" },
          avgRating: { $avg: "$userFeedback.rating" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    res.json({
      destinations: popularDestinations,
      success: true,
    });
  } catch (error) {
    console.error("Popular destinations error:", error);
    res.status(500).json({
      message: "Failed to get popular destinations",
      error: error.message,
      success: false,
    });
  }
});

module.exports = router;
