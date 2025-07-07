const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Hotel = require("../models/Hotel");
const {
  authenticate,
  optionalAuth,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get All Hotels (with optional filtering for featured hotels)
router.get("/", async (req, res) => {
  try {
    const { featured, limit = 12, page = 1 } = req.query;

    const query = { isActive: true };

    // If featured is requested, get top-rated hotels
    let hotels;
    if (featured === "true") {
      hotels = await Hotel.find(query)
        .sort({ "rating.average": -1, featured: -1 })
        .limit(parseInt(limit))
        .select("-rooms.availability -__v");
    } else {
      const skip = (page - 1) * limit;
      hotels = await Hotel.find(query)
        .sort({ "rating.average": -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-rooms.availability -__v");
    }

    res.json({
      message: "Hotels retrieved successfully",
      hotels,
      count: hotels.length,
    });
  } catch (error) {
    console.error("Get hotels error:", error);
    res.status(500).json({
      message: "Error retrieving hotels",
      error: error.message,
    });
  }
});

// Search Hotels
router.get(
  "/search",
  [
    query("city").optional().trim(),
    query("state").optional().trim(),
    query("checkIn")
      .optional()
      .isISO8601()
      .withMessage("Invalid check-in date format"),
    query("checkOut")
      .optional()
      .isISO8601()
      .withMessage("Invalid check-out date format"),
    query("guests")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Guests must be between 1 and 20"),
    query("minPrice")
      .optional()
      .isNumeric()
      .withMessage("Min price must be a number"),
    query("maxPrice")
      .optional()
      .isNumeric()
      .withMessage("Max price must be a number"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Invalid search parameters",
          errors: errors.array(),
        });
      }

      const {
        city,
        state,
        checkIn,
        checkOut,
        guests = 1,
        minPrice,
        maxPrice,
        amenities,
        rating,
        sortBy = "rating",
        page = 1,
        limit = 12,
      } = req.query;

      // Build search query
      const searchQuery = { isActive: true };

      if (city) {
        searchQuery["location.city"] = { $regex: city, $options: "i" };
      }

      if (state) {
        searchQuery["location.state"] = { $regex: state, $options: "i" };
      }

      if (rating) {
        searchQuery["rating.average"] = { $gte: parseFloat(rating) };
      }

      if (amenities) {
        const amenityList = Array.isArray(amenities) ? amenities : [amenities];
        searchQuery.amenities = { $in: amenityList };
      }

      // Price filter (based on minimum room price)
      const priceMatch = {};
      if (minPrice || maxPrice) {
        if (minPrice) priceMatch.$gte = parseFloat(minPrice);
        if (maxPrice) priceMatch.$lte = parseFloat(maxPrice);
      }

      // Aggregation pipeline for complex queries
      const pipeline = [
        { $match: searchQuery },
        {
          $addFields: {
            minPrice: { $min: "$rooms.basePrice" },
          },
        },
      ];

      // Add price filter if specified
      if (Object.keys(priceMatch).length > 0) {
        pipeline.push({ $match: { minPrice: priceMatch } });
      }

      // Add sorting
      const sortOptions = {};
      switch (sortBy) {
        case "price-low":
          sortOptions.minPrice = 1;
          break;
        case "price-high":
          sortOptions.minPrice = -1;
          break;
        case "rating":
          sortOptions["rating.average"] = -1;
          break;
        case "name":
          sortOptions.name = 1;
          break;
        default:
          sortOptions["rating.average"] = -1;
      }
      pipeline.push({ $sort: sortOptions });

      // Add pagination
      pipeline.push(
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      );

      // Execute search
      const hotels = await Hotel.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline = [
        { $match: searchQuery },
        {
          $addFields: {
            minPrice: { $min: "$rooms.basePrice" },
          },
        },
      ];
      if (Object.keys(priceMatch).length > 0) {
        countPipeline.push({ $match: { minPrice: priceMatch } });
      }
      countPipeline.push({ $count: "total" });

      const countResult = await Hotel.aggregate(countPipeline);
      const totalHotels = countResult.length > 0 ? countResult[0].total : 0;

      // If dates are provided, check availability
      let availableHotels = hotels;
      if (checkIn && checkOut) {
        availableHotels = await Promise.all(
          hotels.map(async (hotel) => {
            const availableRooms = await Hotel.findById(hotel._id).then((h) =>
              h
                ? h.getAvailableRooms(new Date(checkIn), new Date(checkOut))
                : []
            );

            const hasAvailableRooms = availableRooms.some(
              (room) => room.availableRooms > 0 && room.maxOccupancy >= guests
            );

            return hasAvailableRooms ? { ...hotel, availableRooms } : null;
          })
        );
        availableHotels = availableHotels.filter((hotel) => hotel !== null);
      }

      res.json({
        message: "Hotels retrieved successfully",
        hotels: availableHotels,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalHotels / limit),
          totalHotels,
          hasNext: page * limit < totalHotels,
          hasPrev: page > 1,
        },
        searchParams: {
          city,
          state,
          checkIn,
          checkOut,
          guests,
          minPrice,
          maxPrice,
          amenities,
          rating,
          sortBy,
        },
      });
    } catch (error) {
      console.error("Hotel search error:", error);
      res.status(500).json({
        message: "Hotel search failed",
        error: error.message,
      });
    }
  }
);

// Get Featured Hotels
router.get("/featured", async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const featuredHotels = await Hotel.find({
      isActive: true,
      featured: true,
    })
      .sort({ "rating.average": -1 })
      .limit(parseInt(limit))
      .select("name location images rating amenities");

    res.json({
      message: "Featured hotels retrieved successfully",
      hotels: featuredHotels,
    });
  } catch (error) {
    console.error("Featured hotels error:", error);
    res.status(500).json({
      message: "Failed to fetch featured hotels",
      error: error.message,
    });
  }
});

// Get Hotel by ID
router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate("reviews.user", "name")
      .populate("createdBy", "name email");

    if (!hotel || !hotel.isActive) {
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

// Check Room Availability
router.post(
  "/:id/check-availability",
  [
    body("checkIn").isISO8601().withMessage("Invalid check-in date format"),
    body("checkOut").isISO8601().withMessage("Invalid check-out date format"),
    body("guests")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Guests must be between 1 and 20"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Invalid parameters",
          errors: errors.array(),
        });
      }

      const { checkIn, checkOut, guests = 1 } = req.body;

      const hotel = await Hotel.findById(req.params.id);
      if (!hotel || !hotel.isActive) {
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

      // Check availability
      const availableRooms = await hotel.getAvailableRooms(
        checkInDate,
        checkOutDate
      );

      // Filter rooms that can accommodate the number of guests
      const suitableRooms = availableRooms.filter(
        (room) => room.maxOccupancy >= guests && room.availableRooms > 0
      );

      res.json({
        message: "Availability checked successfully",
        hotel: {
          id: hotel._id,
          name: hotel.name,
          location: hotel.location,
        },
        searchParams: {
          checkIn,
          checkOut,
          guests,
        },
        availableRooms: suitableRooms,
        hasAvailability: suitableRooms.length > 0,
      });
    } catch (error) {
      console.error("Availability check error:", error);
      res.status(500).json({
        message: "Failed to check availability",
        error: error.message,
      });
    }
  }
);

// Add Hotel Review
router.post(
  "/:id/reviews",
  authenticate,
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Comment cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Invalid review data",
          errors: errors.array(),
        });
      }

      const { rating, comment } = req.body;

      const hotel = await Hotel.findById(req.params.id);
      if (!hotel || !hotel.isActive) {
        return res.status(404).json({
          message: "Hotel not found",
        });
      }

      // Check if user has already reviewed this hotel
      const existingReview = hotel.reviews.find(
        (review) => review.user.toString() === req.user._id.toString()
      );

      if (existingReview) {
        return res.status(400).json({
          message: "You have already reviewed this hotel",
        });
      }

      // Add review
      const review = {
        user: req.user._id,
        rating,
        comment: comment || "",
        createdAt: new Date(),
      };

      hotel.reviews.push(review);
      await hotel.updateRating();

      // Populate the new review with user data
      await hotel.populate("reviews.user", "name");

      res.status(201).json({
        message: "Review added successfully",
        review: hotel.reviews[hotel.reviews.length - 1],
        newRating: {
          average: hotel.rating.average,
          count: hotel.rating.count,
        },
      });
    } catch (error) {
      console.error("Review add error:", error);
      res.status(500).json({
        message: "Failed to add review",
        error: error.message,
      });
    }
  }
);

// Get Popular Cities
router.get("/cities/popular", async (req, res) => {
  try {
    const popularCities = await Hotel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            city: "$location.city",
            state: "$location.state",
          },
          hotelCount: { $sum: 1 },
          avgRating: { $avg: "$rating.average" },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          state: "$_id.state",
          hotelCount: 1,
          avgRating: { $round: ["$avgRating", 1] },
        },
      },
      { $sort: { hotelCount: -1, avgRating: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      message: "Popular cities retrieved successfully",
      cities: popularCities,
    });
  } catch (error) {
    console.error("Popular cities error:", error);
    res.status(500).json({
      message: "Failed to fetch popular cities",
      error: error.message,
    });
  }
});

// Get Hotel Recommendations (AI-powered)
router.get("/recommendations/:userId", optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 6 } = req.query;

    // Simple recommendation logic based on user preferences and popular hotels
    let recommendationQuery = { isActive: true };

    // If authenticated user matches the requested user ID, use their preferences
    if (req.user && req.user._id.toString() === userId) {
      const user = req.user;

      if (user.preferences.favoriteDestinations.length > 0) {
        recommendationQuery["location.city"] = {
          $in: user.preferences.favoriteDestinations,
        };
      }

      if (user.preferences.priceRange) {
        // Find hotels with rooms in user's price range
        recommendationQuery = {
          ...recommendationQuery,
          "rooms.basePrice": {
            $gte: user.preferences.priceRange.min,
            $lte: user.preferences.priceRange.max,
          },
        };
      }
    }

    // Get recommendations
    let recommendations = await Hotel.find(recommendationQuery)
      .sort({ "rating.average": -1, featured: -1 })
      .limit(parseInt(limit))
      .select("name location images rating amenities");

    // If not enough recommendations, fall back to popular hotels
    if (recommendations.length < limit) {
      const additionalHotels = await Hotel.find({
        isActive: true,
        _id: { $nin: recommendations.map((h) => h._id) },
      })
        .sort({ "rating.average": -1 })
        .limit(parseInt(limit) - recommendations.length)
        .select("name location images rating amenities");

      recommendations = [...recommendations, ...additionalHotels];
    }

    res.json({
      message: "Recommendations retrieved successfully",
      hotels: recommendations,
      isPersonalized: req.user && req.user._id.toString() === userId,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
});

module.exports = router;
