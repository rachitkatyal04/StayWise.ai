const express = require("express");
const AIRecommendationService = require("../services/aiRecommendationService");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Get personalized recommendations for authenticated user
router.get("/personalized", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      limit = 6,
      excludeBookedHotels = true,
      location,
      priceMin,
      priceMax,
    } = req.query;

    const options = {
      limit: parseInt(limit),
      excludeBookedHotels: excludeBookedHotels === "true",
      location: location || null,
      priceRange:
        priceMin && priceMax
          ? {
              min: parseInt(priceMin),
              max: parseInt(priceMax),
            }
          : null,
    };

    const recommendations =
      await AIRecommendationService.getPersonalizedRecommendations(
        userId,
        options
      );

    res.json({
      message: "Personalized recommendations retrieved successfully",
      recommendations,
      count: recommendations.length,
      userId: userId,
    });
  } catch (error) {
    console.error("Personalized recommendations error:", error);
    res.status(500).json({
      message: "Failed to get personalized recommendations",
      error: error.message,
    });
  }
});

// Get trending recommendations (no auth required)
router.get("/trending", async (req, res) => {
  try {
    const { location, limit = 6 } = req.query;

    const recommendations =
      await AIRecommendationService.getTrendingRecommendations(
        location,
        parseInt(limit)
      );

    res.json({
      message: "Trending recommendations retrieved successfully",
      recommendations,
      count: recommendations.length,
      season: getCurrentSeason(),
    });
  } catch (error) {
    console.error("Trending recommendations error:", error);
    res.status(500).json({
      message: "Failed to get trending recommendations",
      error: error.message,
    });
  }
});

// Track user interaction for AI learning
router.post("/track", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { interactionType, data } = req.body;

    if (!interactionType || !data) {
      return res.status(400).json({
        message: "Interaction type and data are required",
      });
    }

    await AIRecommendationService.trackUserInteraction(
      userId,
      interactionType,
      data
    );

    res.json({
      message: "User interaction tracked successfully",
    });
  } catch (error) {
    console.error("Track interaction error:", error);
    res.status(500).json({
      message: "Failed to track user interaction",
      error: error.message,
    });
  }
});

// Submit feedback on recommendations
router.post("/feedback", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { hotelId, feedback, clicked = false, booked = false } = req.body;

    if (!hotelId || !feedback) {
      return res.status(400).json({
        message: "Hotel ID and feedback are required",
      });
    }

    const feedbackData = {
      hotel: hotelId,
      feedback,
      clicked,
      booked,
      timestamp: new Date(),
    };

    await AIRecommendationService.trackUserInteraction(
      userId,
      "recommendation_feedback",
      feedbackData
    );

    res.json({
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
});

// Get user's recommendation preferences
router.get("/preferences", authenticate, async (req, res) => {
  try {
    const UserBehavior = require("../models/UserBehavior");
    const userId = req.user._id;

    const userBehavior = await UserBehavior.findOne({ user: userId });

    if (!userBehavior) {
      return res.json({
        message: "No preferences found - new user",
        preferences: {
          travelStyle: "mid-range",
          locationPreference: "city-center",
          preferredLocations: [],
          preferredSeasons: [],
          aiPreferences: {
            loyaltyScore: 0,
            discoveryScore: 50,
          },
        },
      });
    }

    res.json({
      message: "User preferences retrieved successfully",
      preferences: {
        travelStyle: userBehavior.aiPreferences?.travelStyle || "mid-range",
        locationPreference:
          userBehavior.aiPreferences?.locationPreference || "city-center",
        preferredLocations:
          userBehavior.bookingPatterns?.preferredLocations || [],
        preferredSeasons: userBehavior.bookingPatterns?.preferredSeasons || [],
        preferredPriceRange: userBehavior.bookingPatterns
          ?.preferredPriceRange || {
          min: 0,
          max: 50000,
        },
        aiPreferences: userBehavior.aiPreferences || {
          loyaltyScore: 0,
          discoveryScore: 50,
        },
        searchHistory: userBehavior.searches?.slice(0, 5) || [],
      },
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      message: "Failed to get user preferences",
      error: error.message,
    });
  }
});

// Get recommendation insights/stats
router.get("/insights", authenticate, async (req, res) => {
  try {
    const UserBehavior = require("../models/UserBehavior");
    const Booking = require("../models/Booking");
    const userId = req.user._id;

    const [userBehavior, bookingCount] = await Promise.all([
      UserBehavior.findOne({ user: userId }),
      Booking.countDocuments({ user: userId }),
    ]);

    const insights = {
      totalBookings: bookingCount,
      totalSearches: userBehavior?.searches?.length || 0,
      totalHotelsViewed: userBehavior?.hotelViews?.length || 0,
      favoriteLocations:
        userBehavior?.bookingPatterns?.preferredLocations
          ?.sort((a, b) => b.count - a.count)
          ?.slice(0, 3) || [],
      travelStyle: userBehavior?.aiPreferences?.travelStyle || "discovering",
      loyaltyLevel: getLoyaltyLevel(
        userBehavior?.aiPreferences?.loyaltyScore || 0
      ),
      recommendationAccuracy: calculateRecommendationAccuracy(
        userBehavior?.recommendationFeedback || []
      ),
    };

    res.json({
      message: "User insights retrieved successfully",
      insights,
    });
  } catch (error) {
    console.error("Get insights error:", error);
    res.status(500).json({
      message: "Failed to get insights",
      error: error.message,
    });
  }
});

// Helper functions
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function getLoyaltyLevel(score) {
  if (score >= 80) return "Diamond";
  if (score >= 60) return "Gold";
  if (score >= 40) return "Silver";
  if (score >= 20) return "Bronze";
  return "Explorer";
}

function calculateRecommendationAccuracy(feedbacks) {
  if (feedbacks.length === 0) return 0;

  const positiveCount = feedbacks.filter(
    (f) =>
      f.feedback === "liked" ||
      f.feedback === "perfect" ||
      f.clicked ||
      f.booked
  ).length;

  return Math.round((positiveCount / feedbacks.length) * 100);
}

module.exports = router;
