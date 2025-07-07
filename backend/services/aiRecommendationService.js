const Hotel = require("../models/Hotel");
const UserBehavior = require("../models/UserBehavior");
const Booking = require("../models/Booking");

class AIRecommendationService {
  // Main recommendation function
  static async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 6,
        excludeBookedHotels = true,
        location = null,
        priceRange = null,
      } = options;

      // Get user behavior data
      const userBehavior = await UserBehavior.findOne({ user: userId })
        .populate("hotelViews.hotel")
        .populate("recommendationFeedback.hotel");

      // Get user's booking history
      const userBookings = await Booking.find({ user: userId }).populate(
        "hotel"
      );

      // Generate recommendations using multiple algorithms
      const recommendations = await this.generateRecommendations(
        userId,
        userBehavior,
        userBookings,
        { limit: limit * 3, location, priceRange }
      );

      // Filter out already booked hotels if requested
      let filteredRecommendations = recommendations;
      if (excludeBookedHotels && userBookings.length > 0) {
        const bookedHotelIds = userBookings.map((b) => b.hotel._id.toString());
        filteredRecommendations = recommendations.filter(
          (rec) => !bookedHotelIds.includes(rec.hotel._id.toString())
        );
      }

      // Return top recommendations with scores
      return filteredRecommendations.slice(0, limit);
    } catch (error) {
      console.error("AI Recommendation Error:", error);
      // Fallback to popular hotels
      return await this.getFallbackRecommendations(limit);
    }
  }

  // Core recommendation algorithm
  static async generateRecommendations(
    userId,
    userBehavior,
    userBookings,
    options
  ) {
    const { limit, location, priceRange } = options;

    // Build base query
    let query = { isActive: true };
    if (location) {
      query["location.city"] = new RegExp(location, "i");
    }
    if (priceRange) {
      query["rooms.basePrice"] = {
        $gte: priceRange.min || 0,
        $lte: priceRange.max || 50000,
      };
    }

    // Get candidate hotels
    const candidateHotels = await Hotel.find(query)
      .limit(limit * 2)
      .populate("reviews");

    // Score each hotel using multiple factors
    const scoredHotels = await Promise.all(
      candidateHotels.map(async (hotel) => {
        const score = await this.calculateHotelScore(
          hotel,
          userBehavior,
          userBookings,
          userId
        );
        return {
          hotel,
          score,
          reasons: await this.getRecommendationReasons(
            hotel,
            userBehavior,
            userBookings
          ),
        };
      })
    );

    // Sort by score and return
    return scoredHotels.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Calculate recommendation score for a hotel
  static async calculateHotelScore(hotel, userBehavior, userBookings, userId) {
    let score = 0;

    // Base score from hotel rating and popularity
    score += (hotel.rating || 4) * 10;
    score += Math.min((hotel.reviews?.length || 0) * 0.1, 20);

    if (!userBehavior) {
      return score; // Return base score for new users
    }

    // Location preference scoring
    score += this.scoreLocationPreference(hotel, userBehavior);

    // Price preference scoring
    score += this.scorePricePreference(hotel, userBehavior);

    // Amenity preference scoring
    score += this.scoreAmenityPreference(hotel, userBehavior);

    // Seasonal preference scoring
    score += this.scoreSeasonalPreference(hotel, userBehavior);

    // Similar hotel preference scoring
    score += await this.scoreSimilarHotels(hotel, userBehavior, userBookings);

    // User interaction history scoring
    score += this.scoreUserInteractions(hotel, userBehavior);

    // Diversity bonus (encourage exploration)
    score += this.scoreDiversityBonus(hotel, userBehavior, userBookings);

    return Math.round(score * 100) / 100;
  }

  // Score based on location preferences
  static scoreLocationPreference(hotel, userBehavior) {
    let score = 0;

    if (userBehavior.bookingPatterns?.preferredLocations?.length > 0) {
      const preferredLocation =
        userBehavior.bookingPatterns.preferredLocations.find(
          (loc) =>
            loc.city === hotel.location.city &&
            loc.state === hotel.location.state
        );

      if (preferredLocation) {
        score += Math.min(preferredLocation.count * 15, 50);
      }

      // Nearby locations bonus
      const nearbyLocations =
        userBehavior.bookingPatterns.preferredLocations.filter(
          (loc) => loc.state === hotel.location.state
        );
      if (nearbyLocations.length > 0) {
        score += 10;
      }
    }

    return score;
  }

  // Score based on price preferences
  static scorePricePreference(hotel, userBehavior) {
    let score = 0;

    if (userBehavior.bookingPatterns?.preferredPriceRange) {
      const userMin = userBehavior.bookingPatterns.preferredPriceRange.min;
      const userMax = userBehavior.bookingPatterns.preferredPriceRange.max;
      const hotelPrice = hotel.rooms?.[0]?.basePrice || 5000;

      if (hotelPrice >= userMin && hotelPrice <= userMax) {
        score += 30;
      } else {
        // Penalty for being outside range
        const distance = Math.min(
          Math.abs(hotelPrice - userMax),
          Math.abs(hotelPrice - userMin)
        );
        score -= Math.min(distance / 1000, 20);
      }
    }

    return score;
  }

  // Score based on amenity preferences
  static scoreAmenityPreference(hotel, userBehavior) {
    let score = 0;

    if (
      userBehavior.bookingPatterns?.preferredAmenities?.length > 0 &&
      hotel.amenities?.length > 0
    ) {
      const hotelAmenities = hotel.amenities.map((a) => a.toLowerCase());

      userBehavior.bookingPatterns.preferredAmenities.forEach((prefAmenity) => {
        if (
          hotelAmenities.some((ha) =>
            ha.includes(prefAmenity.amenity.toLowerCase())
          )
        ) {
          score += prefAmenity.weight * 10;
        }
      });
    }

    return score;
  }

  // Score based on seasonal preferences
  static scoreSeasonalPreference(hotel, userBehavior) {
    let score = 0;

    if (userBehavior.bookingPatterns?.preferredSeasons?.length > 0) {
      const currentMonth = new Date().getMonth();
      let currentSeason;

      if (currentMonth >= 2 && currentMonth <= 4) currentSeason = "spring";
      else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = "summer";
      else if (currentMonth >= 8 && currentMonth <= 10)
        currentSeason = "autumn";
      else currentSeason = "winter";

      const seasonPref = userBehavior.bookingPatterns.preferredSeasons.find(
        (s) => s.season === currentSeason
      );

      if (seasonPref) {
        score += Math.min(seasonPref.count * 8, 25);
      }
    }

    return score;
  }

  // Score based on similar hotels user has booked
  static async scoreSimilarHotels(hotel, userBehavior, userBookings) {
    let score = 0;

    if (userBookings.length > 0) {
      for (const booking of userBookings) {
        if (booking.hotel) {
          // Same category bonus
          if (hotel.category === booking.hotel.category) {
            score += 15;
          }

          // Similar rating bonus
          const ratingDiff = Math.abs(
            (hotel.rating || 4) - (booking.hotel.rating || 4)
          );
          if (ratingDiff <= 0.5) {
            score += 10;
          }

          // Similar price range bonus
          const hotelPrice = hotel.rooms?.[0]?.basePrice || 5000;
          const bookedPrice = booking.hotel.rooms?.[0]?.basePrice || 5000;
          const priceDiff =
            Math.abs(hotelPrice - bookedPrice) /
            Math.max(hotelPrice, bookedPrice);

          if (priceDiff <= 0.3) {
            score += 12;
          }
        }
      }
    }

    return score;
  }

  // Score based on user's previous interactions
  static scoreUserInteractions(hotel, userBehavior) {
    let score = 0;

    if (userBehavior.hotelViews?.length > 0) {
      const hotelView = userBehavior.hotelViews.find(
        (view) => view.hotel?._id?.toString() === hotel._id.toString()
      );

      if (hotelView) {
        score += 20; // Viewed before
        score += Math.min(hotelView.duration / 10, 15); // Time spent viewing
      }
    }

    // Check recommendation feedback
    if (userBehavior.recommendationFeedback?.length > 0) {
      const feedback = userBehavior.recommendationFeedback.find(
        (fb) => fb.hotel?._id?.toString() === hotel._id.toString()
      );

      if (feedback) {
        switch (feedback.feedback) {
          case "liked":
          case "perfect":
            score += 25;
            break;
          case "disliked":
            score -= 30;
            break;
          case "irrelevant":
            score -= 15;
            break;
        }
      }
    }

    return score;
  }

  // Encourage exploration of new types of hotels
  static scoreDiversityBonus(hotel, userBehavior, userBookings) {
    let score = 0;

    if (userBehavior.aiPreferences?.discoveryScore > 60) {
      // User likes exploring new options
      const bookedCategories = userBookings
        .map((b) => b.hotel?.category)
        .filter(Boolean);

      if (!bookedCategories.includes(hotel.category)) {
        score += 20; // New category exploration bonus
      }

      const bookedLocations = userBookings
        .map((b) => b.hotel?.location?.city)
        .filter(Boolean);
      if (!bookedLocations.includes(hotel.location.city)) {
        score += 15; // New location exploration bonus
      }
    }

    return score;
  }

  // Generate reasons for recommendation
  static async getRecommendationReasons(hotel, userBehavior, userBookings) {
    const reasons = [];

    // Based on location history
    if (userBehavior?.bookingPatterns?.preferredLocations?.length > 0) {
      const preferredLocation =
        userBehavior.bookingPatterns.preferredLocations.find(
          (loc) => loc.city === hotel.location.city
        );
      if (preferredLocation) {
        reasons.push(`You've enjoyed staying in ${hotel.location.city} before`);
      }
    }

    // Based on similar hotels
    if (userBookings.length > 0) {
      const similarBooking = userBookings.find(
        (b) => b.hotel?.category === hotel.category
      );
      if (similarBooking) {
        reasons.push(`Similar to ${similarBooking.hotel.name} which you loved`);
      }
    }

    // Based on rating
    if (hotel.rating >= 4.5) {
      reasons.push(`Highly rated (${hotel.rating}/5) by guests`);
    }

    // Based on amenities
    if (hotel.amenities?.includes("Free WiFi")) {
      reasons.push("Free WiFi available");
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push("Popular choice among travelers");
    }

    return reasons.slice(0, 2); // Return top 2 reasons
  }

  // Fallback recommendations for new users or errors
  static async getFallbackRecommendations(limit = 6) {
    try {
      const hotels = await Hotel.find({ isActive: true })
        .sort({ rating: -1, "reviews.length": -1 })
        .limit(limit)
        .populate("reviews");

      return hotels.map((hotel) => ({
        hotel,
        score: (hotel.rating || 4) * 10,
        reasons: ["Popular choice among travelers", "Highly rated by guests"],
      }));
    } catch (error) {
      console.error("Fallback recommendations error:", error);
      return [];
    }
  }

  // Update user behavior after interactions
  static async trackUserInteraction(userId, interactionType, data) {
    try {
      let userBehavior = await UserBehavior.findOne({ user: userId });

      if (!userBehavior) {
        userBehavior = new UserBehavior({ user: userId });
      }

      switch (interactionType) {
        case "search":
          await userBehavior.addSearch(data);
          break;
        case "hotel_view":
          await userBehavior.addHotelView(data.hotelId, data.duration);
          break;
        case "booking":
          await userBehavior.updateBookingPatterns(data);
          break;
        case "recommendation_feedback":
          userBehavior.recommendationFeedback.unshift(data);
          await userBehavior.save();
          break;
      }

      return userBehavior;
    } catch (error) {
      console.error("Error tracking user interaction:", error);
      throw error;
    }
  }

  // Get trending recommendations based on current season and location
  static async getTrendingRecommendations(location = null, limit = 6) {
    try {
      const currentMonth = new Date().getMonth();
      let seasonalFilter = {};

      // Add seasonal logic (e.g., beach hotels in summer, mountain resorts in winter)
      if (currentMonth >= 5 && currentMonth <= 7) {
        // Summer
        seasonalFilter = {
          $or: [
            { amenities: { $regex: "Beach", $options: "i" } },
            { amenities: { $regex: "Pool", $options: "i" } },
            {
              "location.city": {
                $regex: "Goa|Mumbai|Chennai|Kochi",
                $options: "i",
              },
            },
          ],
        };
      } else if (currentMonth >= 11 || currentMonth <= 1) {
        // Winter
        seasonalFilter = {
          $or: [
            {
              "location.city": {
                $regex: "Shimla|Manali|Gulmarg|Mussoorie",
                $options: "i",
              },
            },
            { amenities: { $regex: "Spa|Wellness", $options: "i" } },
          ],
        };
      }

      let query = { isActive: true, ...seasonalFilter };
      if (location) {
        query["location.city"] = new RegExp(location, "i");
      }

      const hotels = await Hotel.find(query)
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit)
        .populate("reviews");

      return hotels.map((hotel) => ({
        hotel,
        score: (hotel.rating || 4) * 10,
        reasons: ["Trending this season", "Perfect for current weather"],
      }));
    } catch (error) {
      console.error("Error getting trending recommendations:", error);
      return [];
    }
  }
}

module.exports = AIRecommendationService;
