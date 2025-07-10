const { GoogleGenerativeAI } = require("@google/generative-ai");
const TripPlan = require("../models/TripPlan");
const Hotel = require("../models/Hotel");
const UserBehavior = require("../models/UserBehavior");
const Booking = require("../models/Booking");

class GeminiTripPlanningAI {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async generateTripPlan(userId, tripData) {
    const startTime = Date.now();

    try {
      console.log(
        "🤖 Starting Gemini trip generation for:",
        tripData.destination.city
      );

      // Get user context for personalization
      const userContext = await this.getUserContext(userId);

      // Get available hotels and attractions
      const availableOptions = await this.getAvailableOptions(
        tripData.destination
      );

      // Create comprehensive prompt for Gemini
      const prompt = this.buildTripPlanningPrompt(
        tripData,
        userContext,
        availableOptions
      );

      // Get Gemini response
      const geminiResponse = await this.callGemini(prompt);

      // Parse and validate the response
      const parsedPlan = this.parseGeminiResponse(geminiResponse);

      console.log(
        "🔍 BACKEND DEBUG - Target budget from tripData:",
        tripData.preferences?.budget?.max
      );
      console.log(
        "🔍 BACKEND DEBUG - Parsed plan totalEstimatedCost:",
        parsedPlan.totalEstimatedCost
      );

      // Enforce exact budget match
      const targetBudget = tripData.preferences.budget.max;

      if (!targetBudget || targetBudget <= 0) {
        console.error("❌ Invalid budget value received:", targetBudget);
      } else {
        console.log("💰 Enforcing exact budget:", targetBudget);
      }

      const budgetEnforcedPlan = this.enforceExactBudget(
        parsedPlan,
        targetBudget
      );

      // Enhance with real hotel data
      const enhancedPlan = await this.enhanceWithRealData(
        budgetEnforcedPlan,
        availableOptions
      );

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Save to database
      const tripPlan = await this.saveTripPlan(userId, tripData, enhancedPlan, {
        prompt: prompt.substring(0, 500) + "...", // Store truncated prompt
        responseTime,
        model: "gemini-2.0-flash",
      });

      console.log("✅ Trip plan generated successfully in", responseTime, "ms");
      return tripPlan;
    } catch (error) {
      console.error("❌ Gemini trip planning error:", error);
      // Fallback to simpler plan
      return await this.generateFallbackPlan(userId, tripData);
    }
  }

  async getUserContext(userId) {
    try {
      const userBehavior = await UserBehavior.findOne({ user: userId });
      const recentTrips = await TripPlan.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(3);
      const recentBookings = await Booking.find({ user: userId })
        .populate("hotel")
        .sort({ createdAt: -1 })
        .limit(5);

      return {
        travelStyle: userBehavior?.aiPreferences?.travelStyle || "mid-range",
        preferredLocations:
          userBehavior?.bookingPatterns?.preferredLocations || [],
        budgetRange: userBehavior?.bookingPatterns?.preferredPriceRange || {
          min: 0,
          max: 15000,
        },
        interests:
          userBehavior?.bookingPatterns?.preferredAmenities?.map(
            (a) => a.amenity
          ) || [],
        recentDestinations: recentTrips.map((t) => t.destination.city),
        pastHotels: recentBookings.map((b) => ({
          name: b.hotel?.name,
          city: b.hotel?.location?.city,
          rating: b.hotel?.rating?.average,
        })),
        loyaltyScore: userBehavior?.aiPreferences?.loyaltyScore || 50,
      };
    } catch (error) {
      console.error("Error getting user context:", error);
      return {
        travelStyle: "mid-range",
        interests: [],
        budgetRange: { min: 0, max: 15000 },
      };
    }
  }

  async getAvailableOptions(destination) {
    try {
      // Get hotels
      const hotels = await Hotel.find({
        "location.city": new RegExp(destination.city, "i"),
        isActive: true,
      })
        .limit(15)
        .sort({ "rating.average": -1, featured: -1 });

      // Get attractions data
      const attractions = this.getAttractionsByCity(
        destination.city.toLowerCase()
      );

      return { hotels, attractions };
    } catch (error) {
      console.error("Error getting available options:", error);
      return { hotels: [], attractions: [] };
    }
  }

  getAttractionsByCity(city) {
    const attractionsDB = {
      goa: [
        {
          name: "Baga Beach",
          category: "relaxation",
          duration: 3,
          cost: 0,
          rating: 4.5,
          description: "Popular beach with water sports and beach shacks",
        },
        {
          name: "Dudhsagar Falls",
          category: "adventure",
          duration: 5,
          cost: 500,
          rating: 4.7,
          description: "Spectacular four-tiered waterfall",
        },
        {
          name: "Old Goa Churches",
          category: "culture",
          duration: 2,
          cost: 100,
          rating: 4.3,
          description: "UNESCO World Heritage churches",
        },
        {
          name: "Anjuna Flea Market",
          category: "shopping",
          duration: 2,
          cost: 200,
          rating: 4.2,
          description: "Famous Wednesday flea market",
        },
        {
          name: "Spice Plantation Tour",
          category: "culture",
          duration: 4,
          cost: 800,
          rating: 4.4,
          description: "Learn about spices and enjoy traditional lunch",
        },
        {
          name: "Aguada Fort",
          category: "sightseeing",
          duration: 2,
          cost: 50,
          rating: 4.1,
          description: "17th-century Portuguese fort",
        },
        {
          name: "Calangute Beach",
          category: "relaxation",
          duration: 3,
          cost: 0,
          rating: 4.3,
          description: "Queen of beaches with water sports",
        },
        {
          name: "Chapora Fort",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.0,
          description: "Famous Dil Chahta Hai fort location",
        },
      ],
      jaipur: [
        {
          name: "Hawa Mahal",
          category: "sightseeing",
          duration: 1,
          cost: 200,
          rating: 4.6,
          description: "Palace of Winds with intricate architecture",
        },
        {
          name: "Amber Fort",
          category: "sightseeing",
          duration: 3,
          cost: 500,
          rating: 4.8,
          description: "Magnificent fort with elephant rides",
        },
        {
          name: "City Palace",
          category: "culture",
          duration: 2,
          cost: 300,
          rating: 4.5,
          description: "Royal palace complex with museums",
        },
        {
          name: "Jantar Mantar",
          category: "sightseeing",
          duration: 1,
          cost: 200,
          rating: 4.2,
          description: "UNESCO World Heritage astronomical observatory",
        },
        {
          name: "Nahargarh Fort",
          category: "sightseeing",
          duration: 2,
          cost: 100,
          rating: 4.4,
          description: "Hilltop fort with panoramic city views",
        },
        {
          name: "Johari Bazaar",
          category: "shopping",
          duration: 2,
          cost: 500,
          rating: 4.1,
          description: "Famous jewelry and textile market",
        },
        {
          name: "Jal Mahal",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.3,
          description: "Beautiful water palace in Man Sagar Lake",
        },
        {
          name: "Albert Hall Museum",
          category: "culture",
          duration: 2,
          cost: 150,
          rating: 4.2,
          description: "Rajasthan's state museum with artifacts",
        },
      ],
      mumbai: [
        {
          name: "Gateway of India",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.4,
          description: "Iconic Mumbai landmark and monument",
        },
        {
          name: "Marine Drive",
          category: "sightseeing",
          duration: 2,
          cost: 0,
          rating: 4.5,
          description: "Queen's Necklace promenade by the sea",
        },
        {
          name: "Elephanta Caves",
          category: "culture",
          duration: 4,
          cost: 600,
          rating: 4.6,
          description: "UNESCO World Heritage rock-cut caves",
        },
        {
          name: "Crawford Market",
          category: "shopping",
          duration: 2,
          cost: 300,
          rating: 4.0,
          description: "Historic market for fruits, spices, and goods",
        },
        {
          name: "Chhatrapati Shivaji Terminus",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.3,
          description: "UNESCO World Heritage railway station",
        },
        {
          name: "Juhu Beach",
          category: "relaxation",
          duration: 2,
          cost: 0,
          rating: 4.1,
          description: "Popular beach with street food",
        },
        {
          name: "Siddhivinayak Temple",
          category: "culture",
          duration: 1,
          cost: 0,
          rating: 4.5,
          description: "Famous Ganesha temple",
        },
        {
          name: "Hanging Gardens",
          category: "relaxation",
          duration: 1,
          cost: 0,
          rating: 4.0,
          description: "Terraced gardens on Malabar Hill",
        },
      ],
      delhi: [
        {
          name: "Red Fort",
          category: "sightseeing",
          duration: 2,
          cost: 500,
          rating: 4.5,
          description: "Mughal fortress and UNESCO World Heritage site",
        },
        {
          name: "India Gate",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.4,
          description: "War memorial and iconic Delhi landmark",
        },
        {
          name: "Qutub Minar",
          category: "sightseeing",
          duration: 2,
          cost: 250,
          rating: 4.6,
          description: "UNESCO World Heritage minaret",
        },
        {
          name: "Lotus Temple",
          category: "culture",
          duration: 1,
          cost: 0,
          rating: 4.7,
          description: "Beautiful Bahai House of Worship",
        },
        {
          name: "Humayun's Tomb",
          category: "culture",
          duration: 2,
          cost: 250,
          rating: 4.5,
          description: "Mughal architecture masterpiece",
        },
        {
          name: "Chandni Chowk",
          category: "shopping",
          duration: 3,
          cost: 500,
          rating: 4.2,
          description: "Historic market with street food",
        },
        {
          name: "Akshardham Temple",
          category: "culture",
          duration: 3,
          cost: 170,
          rating: 4.8,
          description: "Modern architectural marvel",
        },
        {
          name: "Raj Ghat",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.1,
          description: "Gandhi's memorial",
        },
      ],
      bangalore: [
        {
          name: "Lalbagh Botanical Garden",
          category: "relaxation",
          duration: 2,
          cost: 20,
          rating: 4.4,
          description: "Historic botanical garden with glass house",
        },
        {
          name: "Bangalore Palace",
          category: "sightseeing",
          duration: 2,
          cost: 460,
          rating: 4.3,
          description: "Tudor-style palace with beautiful architecture",
        },
        {
          name: "Cubbon Park",
          category: "relaxation",
          duration: 2,
          cost: 0,
          rating: 4.2,
          description: "Green lung of the city",
        },
        {
          name: "Tipu Sultan's Summer Palace",
          category: "culture",
          duration: 1,
          cost: 15,
          rating: 4.1,
          description: "Wooden palace of the Tiger of Mysore",
        },
        {
          name: "UB City Mall",
          category: "shopping",
          duration: 3,
          cost: 800,
          rating: 4.5,
          description: "Luxury shopping and dining destination",
        },
        {
          name: "ISKCON Temple",
          category: "culture",
          duration: 2,
          cost: 0,
          rating: 4.6,
          description: "Beautiful Krishna temple",
        },
        {
          name: "Vidhana Soudha",
          category: "sightseeing",
          duration: 1,
          cost: 0,
          rating: 4.0,
          description: "Impressive government building",
        },
        {
          name: "Commercial Street",
          category: "shopping",
          duration: 2,
          cost: 400,
          rating: 4.1,
          description: "Popular shopping street",
        },
      ],
    };

    return attractionsDB[city] || [];
  }

  buildTripPlanningPrompt(tripData, userContext, availableOptions) {
    const { destination, duration, dates, travelers, preferences } = tripData;

    console.log(
      "🔍 PROMPT DEBUG - Building prompt with budget:",
      preferences.budget.max
    );
    console.log(
      "🔍 PROMPT DEBUG - Budget type:",
      typeof preferences.budget.max
    );

    return `You are an expert AI travel planner specializing in India tourism. Create a detailed, personalized ${
      duration.days
    }-day trip plan for ${destination.city}, ${destination.state}.

**Trip Details:**
- Destination: ${destination.city}, ${destination.state}
- Duration: ${duration.days} days, ${duration.nights} nights
- Dates: ${dates.startDate} to ${dates.endDate}
- Travelers: ${travelers.adults} adults, ${travelers.children} children
- TOTAL BUDGET: ₹${preferences.budget.max} (THIS IS THE EXACT AMOUNT TO SPEND)
- Travel Style: ${preferences.travelStyle}
- Interests: ${preferences.interests.join(", ")}
- Accommodation Type: ${preferences.accommodation}

**User Profile:**
- Travel Style: ${userContext.travelStyle}
- Previous Destinations: ${userContext.recentDestinations.join(", ") || "None"}
- Budget Range: ₹${userContext.budgetRange.min} - ₹${
      userContext.budgetRange.max
    }
- Loyalty Score: ${userContext.loyaltyScore}/100

**Available Hotels (Top 5):**
${availableOptions.hotels
  .slice(0, 5)
  .map(
    (h) =>
      `- ${h.name}: ${h.rating.average}/5 stars, ₹${
        h.rooms[0]?.basePrice || "N/A"
      }/night, ${h.location.address}`
  )
  .join("\n")}

**Available Attractions:**
${availableOptions.attractions
  .map(
    (a) =>
      `- ${a.name}: ${a.category}, ${a.duration}h duration, ₹${a.cost} cost, ${a.rating}/5 rating - ${a.description}`
  )
  .join("\n")}

**Instructions:**
1. Create a practical, day-by-day itinerary that feels personally crafted
2. Include realistic timing, travel distances, and costs
3. Balance must-see attractions with user interests
4. Suggest specific hotels from the available list
5. Include local food recommendations and cultural experiences
6. Add insider tips and time-saving suggestions
7. Consider weather, crowd levels, and optimal visit times
8. **🚨 ABSOLUTE BUDGET REQUIREMENT 🚨: The totalEstimatedCost field MUST equal EXACTLY ₹${
      preferences.budget.max
    }. NOT ₹${preferences.budget.max - 1}, NOT ₹${
      preferences.budget.max + 1
    }, but EXACTLY ₹${preferences.budget.max}. This is NON-NEGOTIABLE.**
9. Make it feel authentic and locally informed

**IMPORTANT: Activity Categories - Use ONLY these exact values:**
- "sightseeing" (for monuments, forts, palaces, landmarks)
- "culture" (for temples, museums, cultural sites)
- "food" (for dining, food tours, cooking classes)
- "shopping" (for markets, malls, local shopping)
- "adventure" (for trekking, water sports, outdoor activities)
- "relaxation" (for beaches, parks, gardens, spas)
- "transport" (for travel between locations)
- "experience" (for shows, entertainment, unique activities)

Do NOT use: heritage, spiritual, nature, travel, religious, historical, etc.

**🎯 MATHEMATICAL BUDGET ENFORCEMENT 🎯:**
- totalEstimatedCost = ₹${preferences.budget.max} (ZERO DEVIATION ALLOWED)
- Sum of all accommodation costs + all activity costs + all meal costs = ₹${
      preferences.budget.max
    }
- BEFORE finalizing, calculate: accommodation total + activities total + meals total = ₹${
      preferences.budget.max
    }
- If sum > ₹${preferences.budget.max}: Reduce costs line by line until sum = ₹${
      preferences.budget.max
    }
- If sum < ₹${preferences.budget.max}: Add premium upgrades until sum = ₹${
      preferences.budget.max
    }
- TARGET ALLOCATION (adjust costs to hit exactly ₹${preferences.budget.max}):
  • Accommodation: 40-50% = ₹${Math.round(preferences.budget.max * 0.45)}
  • Activities: 30-35% = ₹${Math.round(preferences.budget.max * 0.32)}
  • Food: 15-20% = ₹${Math.round(preferences.budget.max * 0.18)}
  • Transport: 5-10% = ₹${Math.round(preferences.budget.max * 0.08)}
- VERIFY: Does totalEstimatedCost = ₹${
      preferences.budget.max
    }? If NO, adjust costs!

**CRITICAL: Respond ONLY with valid JSON. No explanations, no markdown, no extra text.**

Generate exactly this JSON structure:

{
  "title": "Trip title",
  "description": "Trip overview",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "bestTimeToVisit": "Season",
  "weatherInfo": "Weather description",
  "totalEstimatedCost": ${preferences.budget.max},
  "aiConfidenceScore": 85,
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "description": "Day overview",
      "accommodation": {
        "hotelName": "Hotel name",
        "roomType": "Room type", 
        "checkIn": "14:00",
        "totalCost": 3000
      },
      "activities": [
        {
          "time": "09:00",
          "duration": 2,
          "title": "Activity name",
          "description": "Description",
          "category": "sightseeing",
          "location": {"name": "Location"},
          "estimatedCost": 500,
          "tips": ["Tip 1"]
        }
      ],
      "meals": [
        {
          "type": "lunch",
          "restaurant": "Restaurant name",
          "cuisine": "Cuisine type",
          "cost": 400,
          "description": "What to try"
        }
      ],
      "totalDayCost": 4000,
      "highlights": ["Day highlight"]
    }
  ]
}

🔥 FINAL VALIDATION 🔥: Before submitting your response, perform this check:
1. Add up ALL accommodation costs across ALL days
2. Add up ALL activity costs across ALL days  
3. Add up ALL meal costs across ALL days
4. Total = accommodation + activities + meals
5. Does total = ₹${preferences.budget.max}? If NO, revise costs until YES!

The totalEstimatedCost field MUST show exactly ₹${
      preferences.budget.max
    } or the response will be rejected!`;
  }

  async callGemini(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw new Error("Failed to generate trip plan with AI");
    }
  }

  parseGeminiResponse(response) {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;

      // Remove markdown code blocks if present
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1];
        if (jsonStr.includes("```")) {
          jsonStr = jsonStr.split("```")[0];
        }
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1];
        if (jsonStr.includes("```")) {
          jsonStr = jsonStr.split("```")[0];
        }
      }

      // Clean up the JSON string more thoroughly
      jsonStr = jsonStr
        .trim()
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes around unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Convert single quotes to double quotes
        .replace(/\n\s*\n/g, "\n"); // Remove extra newlines

      // Try to find the start and end of the JSON object
      const startIndex = jsonStr.indexOf("{");
      const lastBraceIndex = jsonStr.lastIndexOf("}");

      if (startIndex === -1 || lastBraceIndex === -1) {
        throw new Error("No valid JSON object found in response");
      }

      // Extract only the JSON part
      jsonStr = jsonStr.substring(startIndex, lastBraceIndex + 1);

      // Handle incomplete JSON by adding missing closing braces
      const openBraces = (jsonStr.match(/{/g) || []).length;
      const closeBraces = (jsonStr.match(/}/g) || []).length;
      const openArrays = (jsonStr.match(/\[/g) || []).length;
      const closeArrays = (jsonStr.match(/\]/g) || []).length;

      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        jsonStr += "}";
      }

      // Add missing closing brackets
      for (let i = 0; i < openArrays - closeArrays; i++) {
        jsonStr += "]";
      }

      console.log("🔧 Cleaned JSON string length:", jsonStr.length);

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.itinerary || !Array.isArray(parsed.itinerary)) {
        throw new Error("Invalid itinerary format");
      }

      // Ensure totalEstimatedCost exists
      if (!parsed.totalEstimatedCost) {
        parsed.totalEstimatedCost = this.calculateTotalCostFromItinerary(
          parsed.itinerary
        );
      }

      // Fix invalid activity categories
      this.validateAndFixCategories(parsed);

      console.log(
        "✅ Successfully parsed JSON with totalEstimatedCost:",
        parsed.totalEstimatedCost
      );
      return parsed;
    } catch (error) {
      console.error("❌ Failed to parse Gemini response:", error.message);
      console.log("Raw response length:", response.length);
      console.log("Raw response preview:", response.substring(0, 1000));

      // Try a more aggressive cleanup for common JSON issues
      try {
        const repairedPlan = this.attemptAggressiveJSONRepair(response);
        // Note: Budget enforcement will be applied in the main generateTripPlan function
        return repairedPlan;
      } catch (repairError) {
        console.error("❌ JSON repair also failed:", repairError.message);
        throw new Error("Failed to parse AI response - invalid JSON format");
      }
    }
  }

  attemptAggressiveJSONRepair(response) {
    console.log("🔧 Attempting aggressive JSON repair...");

    // Find JSON-like content between first { and last }
    const startIndex = response.indexOf("{");
    const endIndex = response.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON structure found");
    }

    let jsonStr = response.substring(startIndex, endIndex + 1);

    // Fix common JSON issues
    jsonStr = jsonStr
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Single to double quotes
      .replace(/\n/g, " ") // Remove newlines
      .replace(/\s+/g, " ") // Normalize spaces
      .replace(/"\s*\+\s*"/g, "") // Remove string concatenation
      .replace(/,\s*}/g, "}") // Remove trailing commas before }
      .replace(/,\s*]/g, "]"); // Remove trailing commas before ]

    // Try to balance braces
    const openBraces = (jsonStr.match(/{/g) || []).length;
    const closeBraces = (jsonStr.match(/}/g) || []).length;

    if (openBraces > closeBraces) {
      jsonStr += "}".repeat(openBraces - closeBraces);
    }

    const parsed = JSON.parse(jsonStr);

    // Create minimal valid structure if needed
    if (!parsed.itinerary) {
      parsed.itinerary = [];
    }

    if (!parsed.totalEstimatedCost) {
      parsed.totalEstimatedCost = 0;
    }

    console.log("✅ Aggressive JSON repair successful");
    return parsed;
  }

  calculateTotalCostFromItinerary(itinerary) {
    let total = 0;
    itinerary.forEach((day) => {
      if (day.accommodation?.totalCost) total += day.accommodation.totalCost;
      if (day.activities) {
        day.activities.forEach((activity) => {
          if (activity.estimatedCost) total += activity.estimatedCost;
        });
      }
      if (day.meals) {
        day.meals.forEach((meal) => {
          if (meal.cost) total += meal.cost;
        });
      }
    });
    return total;
  }

  enforceExactBudget(parsedPlan, targetBudget) {
    console.log(`🎯 Enforcing exact budget: ₹${targetBudget}`);
    console.log("🔍 BUDGET DEBUG - targetBudget type:", typeof targetBudget);
    console.log("🔍 BUDGET DEBUG - targetBudget value:", targetBudget);

    // Ensure targetBudget is a number
    const numericTargetBudget = Number(targetBudget);
    if (isNaN(numericTargetBudget) || numericTargetBudget <= 0) {
      console.error("❌ Invalid target budget:", targetBudget);
      return parsedPlan; // Return unchanged if invalid budget
    }

    // Calculate current total cost
    const currentTotal = this.calculateTotalCostFromItinerary(
      parsedPlan.itinerary
    );
    console.log(`💰 Current total cost: ₹${currentTotal}`);

    // If already exact, return as is
    if (currentTotal === numericTargetBudget) {
      console.log("✅ Budget already matches exactly!");
      parsedPlan.totalEstimatedCost = numericTargetBudget;
      return parsedPlan;
    }

    // Calculate adjustment ratio
    const adjustmentRatio = numericTargetBudget / currentTotal;
    console.log(`📊 Adjustment ratio: ${adjustmentRatio.toFixed(3)}`);

    // Apply proportional adjustments to all costs
    parsedPlan.itinerary.forEach((day, dayIndex) => {
      // Adjust accommodation costs
      if (day.accommodation?.totalCost) {
        const oldCost = day.accommodation.totalCost;
        day.accommodation.totalCost = Math.round(oldCost * adjustmentRatio);
        console.log(
          `🏨 Day ${day.day} accommodation: ₹${oldCost} → ₹${day.accommodation.totalCost}`
        );
      }

      // Adjust activity costs
      if (day.activities) {
        day.activities.forEach((activity, actIndex) => {
          if (activity.estimatedCost) {
            const oldCost = activity.estimatedCost;
            activity.estimatedCost = Math.round(oldCost * adjustmentRatio);
            console.log(
              `🎪 Day ${day.day} activity ${actIndex + 1}: ₹${oldCost} → ₹${
                activity.estimatedCost
              }`
            );
          }
        });
      }

      // Adjust meal costs
      if (day.meals) {
        day.meals.forEach((meal, mealIndex) => {
          if (meal.cost) {
            const oldCost = meal.cost;
            meal.cost = Math.round(oldCost * adjustmentRatio);
            console.log(
              `🍽️ Day ${day.day} meal ${mealIndex + 1}: ₹${oldCost} → ₹${
                meal.cost
              }`
            );
          }
        });
      }

      // Recalculate day total
      let dayTotal = 0;
      if (day.accommodation?.totalCost) dayTotal += day.accommodation.totalCost;
      if (day.activities) {
        dayTotal += day.activities.reduce(
          (sum, act) => sum + (act.estimatedCost || 0),
          0
        );
      }
      if (day.meals) {
        dayTotal += day.meals.reduce((sum, meal) => sum + (meal.cost || 0), 0);
      }
      day.totalDayCost = dayTotal;
    });

    // Calculate new total and handle rounding differences
    let newTotal = this.calculateTotalCostFromItinerary(parsedPlan.itinerary);
    console.log(`💰 New total after proportional adjustment: ₹${newTotal}`);

    // CRITICAL: Ensure day totals sum exactly to target budget
    let dayTotalsSum = parsedPlan.itinerary.reduce(
      (sum, day) => sum + day.totalDayCost,
      0
    );
    console.log(`💰 Day totals sum: ₹${dayTotalsSum}`);

    const difference = numericTargetBudget - dayTotalsSum;
    if (difference !== 0) {
      console.log(
        `🔧 Day totals difference: ₹${difference}, adjusting largest day...`
      );

      // Find the day with the largest total cost to adjust
      let largestDayIndex = 0;
      let largestDayTotal = 0;

      parsedPlan.itinerary.forEach((day, index) => {
        if (day.totalDayCost > largestDayTotal) {
          largestDayTotal = day.totalDayCost;
          largestDayIndex = index;
        }
      });

      // Adjust the largest day's accommodation cost and day total
      if (parsedPlan.itinerary[largestDayIndex].accommodation) {
        parsedPlan.itinerary[largestDayIndex].accommodation.totalCost +=
          difference;
      }
      parsedPlan.itinerary[largestDayIndex].totalDayCost += difference;

      console.log(`🏨 Adjusted Day ${largestDayIndex + 1} by ₹${difference}`);
      console.log(
        `🏨 Day ${largestDayIndex + 1} new total: ₹${
          parsedPlan.itinerary[largestDayIndex].totalDayCost
        }`
      );
    }

    // Final verification of day totals
    const finalDaySum = parsedPlan.itinerary.reduce(
      (sum, day) => sum + day.totalDayCost,
      0
    );
    console.log(`💰 FINAL day totals sum: ₹${finalDaySum}`);

    if (finalDaySum !== numericTargetBudget) {
      console.error(
        `❌ CRITICAL ERROR: Day totals (₹${finalDaySum}) don't match target (₹${numericTargetBudget})`
      );
    }

    // Final verification - Force exact budget match
    parsedPlan.totalEstimatedCost = numericTargetBudget;

    const calculatedTotal = this.calculateTotalCostFromItinerary(
      parsedPlan.itinerary
    );
    console.log(`🎯 Calculated total: ₹${calculatedTotal}`);
    console.log(
      `🎯 Forced totalEstimatedCost: ₹${parsedPlan.totalEstimatedCost}`
    );

    if (calculatedTotal === numericTargetBudget) {
      console.log(
        "✅ SUCCESS: Budget enforcement complete - exact match achieved!"
      );
    } else {
      console.log(
        `⚠️ WARNING: Calculated total (₹${calculatedTotal}) doesn't match target (₹${numericTargetBudget})`
      );
      console.log("⚠️ But totalEstimatedCost is forced to match target budget");
    }

    return parsedPlan;
  }

  validateAndFixCategories(parsedPlan) {
    const validCategories = [
      "sightseeing",
      "food",
      "shopping",
      "adventure",
      "culture",
      "relaxation",
      "transport",
      "experience",
    ];

    const categoryMapping = {
      heritage: "sightseeing",
      spiritual: "culture",
      nature: "relaxation",
      beach: "relaxation",
      travel: "transport",
      historical: "sightseeing",
      religious: "culture",
      outdoor: "adventure",
      wellness: "relaxation",
      entertainment: "experience",
      nightlife: "experience",
      photography: "experience",
    };

    // Fix categories in all itinerary days
    if (parsedPlan.itinerary) {
      parsedPlan.itinerary.forEach((day) => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach((activity) => {
            if (activity.category) {
              // If category is invalid, map it to a valid one
              if (!validCategories.includes(activity.category)) {
                const oldCategory = activity.category;
                const mappedCategory =
                  categoryMapping[activity.category.toLowerCase()];
                activity.category = mappedCategory || "experience"; // Default fallback
                console.log(
                  `🔧 Fixed invalid category: ${oldCategory} → ${activity.category}`
                );
              }
            } else {
              // If no category, assign default
              activity.category = "experience";
            }
          });
        }
      });
    }
  }

  async enhanceWithRealData(parsedPlan, availableOptions) {
    try {
      // Match suggested hotels with real hotel data
      for (let day of parsedPlan.itinerary) {
        if (day.accommodation && day.accommodation.hotelName) {
          const matchedHotel = availableOptions.hotels.find(
            (h) =>
              h.name
                .toLowerCase()
                .includes(day.accommodation.hotelName.toLowerCase()) ||
              day.accommodation.hotelName
                .toLowerCase()
                .includes(h.name.toLowerCase())
          );

          if (matchedHotel) {
            day.accommodation.hotel = matchedHotel._id.toString();
            day.accommodation.totalCost =
              matchedHotel.rooms[0]?.basePrice || day.accommodation.totalCost;
          }
        }
      }

      return parsedPlan;
    } catch (error) {
      console.error("Error enhancing with real data:", error);
      return parsedPlan;
    }
  }

  async saveTripPlan(userId, tripData, enhancedPlan, aiMetadata) {
    try {
      const tripPlan = new TripPlan({
        user: userId,
        destination: tripData.destination,
        duration: tripData.duration,
        dates: tripData.dates,
        travelers: tripData.travelers,
        preferences: tripData.preferences,
        itinerary: enhancedPlan.itinerary.map((day) => ({
          ...day,
          date: new Date(
            new Date(tripData.dates.startDate).getTime() +
              (day.day - 1) * 24 * 60 * 60 * 1000
          ),
        })),
        summary: {
          totalCost: enhancedPlan.totalEstimatedCost || 0,
          accommodationCost: enhancedPlan.itinerary.reduce(
            (sum, day) => sum + (day.accommodation?.totalCost || 0),
            0
          ),
          activitiesCost: enhancedPlan.itinerary.reduce(
            (sum, day) =>
              sum +
              day.activities.reduce(
                (actSum, act) => actSum + (act.estimatedCost || 0),
                0
              ),
            0
          ),
          foodCost: enhancedPlan.itinerary.reduce(
            (sum, day) =>
              sum +
              day.meals.reduce(
                (mealSum, meal) => mealSum + (meal.cost || 0),
                0
              ),
            0
          ),
          aiConfidenceScore: enhancedPlan.aiConfidenceScore || 80,
          highlights: enhancedPlan.highlights || [],
          tips: enhancedPlan.tips || [],
          bestTimeToVisit: enhancedPlan.bestTimeToVisit,
          weatherInfo: enhancedPlan.weatherInfo,
        },
        aiGenerated: {
          model: aiMetadata.model,
          generatedAt: new Date(),
          prompt: aiMetadata.prompt,
          responseTime: aiMetadata.responseTime,
        },
        status: "generated",
      });

      // Skip calculateTotalCost to preserve budget enforcement
      console.log("✅ Preserving exact budget match from enforcement");

      await tripPlan.save();

      // Populate hotel references safely
      try {
        await tripPlan.populate("itinerary.accommodation.hotel");
      } catch (populateError) {
        console.log(
          "⚠️ Hotel population failed, continuing without it:",
          populateError.message
        );
        // Continue without population if hotel IDs are invalid
      }

      return tripPlan;
    } catch (error) {
      console.error("Error saving trip plan:", error);
      throw new Error("Failed to save trip plan");
    }
  }

  async generateFallbackPlan(userId, tripData) {
    console.log("🔄 Generating fallback trip plan...");

    try {
      // Create a simple fallback plan
      const hotels = await Hotel.find({
        "location.city": new RegExp(tripData.destination.city, "i"),
        isActive: true,
      })
        .limit(3)
        .sort({ "rating.average": -1 });

      const selectedHotel = hotels[0];
      const attractions = this.getAttractionsByCity(
        tripData.destination.city.toLowerCase()
      );

      const itinerary = [];
      for (let day = 1; day <= tripData.duration.days; day++) {
        const dayDate = new Date(
          new Date(tripData.dates.startDate).getTime() +
            (day - 1) * 24 * 60 * 60 * 1000
        );

        itinerary.push({
          day,
          date: dayDate,
          title: `Day ${day} - Explore ${tripData.destination.city}`,
          description: `Discover the highlights of ${tripData.destination.city}`,
          accommodation: selectedHotel
            ? {
                hotel: selectedHotel._id,
                hotelName: selectedHotel.name,
                checkIn: day === 1 ? "14:00" : null,
                checkOut: day === tripData.duration.days ? "12:00" : null,
                roomType: selectedHotel.rooms[0]?.type || "Standard",
                totalCost: selectedHotel.rooms[0]?.basePrice || 3000,
              }
            : null,
          activities: attractions.slice(0, 3).map((attraction, index) => ({
            time: ["09:00", "14:00", "18:00"][index],
            duration: attraction.duration,
            title: `Visit ${attraction.name}`,
            description: attraction.description,
            category: attraction.category,
            location: { name: attraction.name },
            estimatedCost: attraction.cost,
            tips: [`Allow ${attraction.duration} hours for this visit`],
          })),
          meals: [
            {
              type: "lunch",
              restaurant: "Local Restaurant",
              cuisine: "Local",
              cost: 400,
              description: "Try local specialties",
            },
          ],
          totalDayCost: 4000,
          highlights: [`Explore ${attractions[0]?.name || "main attractions"}`],
        });
      }

      // Create fallback plan structure and enforce budget
      const fallbackPlan = {
        title: `${tripData.destination.city} Explorer`,
        description: `A simple ${tripData.duration.days}-day trip to ${tripData.destination.city}`,
        highlights: ["Basic itinerary generated"],
        tips: [
          "This is a fallback plan - contact support for better recommendations",
        ],
        bestTimeToVisit: "Year round",
        weatherInfo: "Check local weather forecast",
        totalEstimatedCost: tripData.preferences.budget.max,
        aiConfidenceScore: 60,
        itinerary,
      };

      // Apply budget enforcement to fallback plan
      const budgetEnforcedFallback = this.enforceExactBudget(
        fallbackPlan,
        tripData.preferences.budget.max
      );

      const tripPlan = new TripPlan({
        user: userId,
        destination: tripData.destination,
        duration: tripData.duration,
        dates: tripData.dates,
        travelers: tripData.travelers,
        preferences: tripData.preferences,
        itinerary: budgetEnforcedFallback.itinerary,
        summary: {
          totalCost: budgetEnforcedFallback.totalEstimatedCost,
          accommodationCost: budgetEnforcedFallback.itinerary.reduce(
            (sum, day) => sum + (day.accommodation?.totalCost || 0),
            0
          ),
          activitiesCost: budgetEnforcedFallback.itinerary.reduce(
            (sum, day) =>
              sum +
              day.activities.reduce(
                (actSum, act) => actSum + (act.estimatedCost || 0),
                0
              ),
            0
          ),
          foodCost: budgetEnforcedFallback.itinerary.reduce(
            (sum, day) =>
              sum +
              day.meals.reduce(
                (mealSum, meal) => mealSum + (meal.cost || 0),
                0
              ),
            0
          ),
          aiConfidenceScore: 60,
          highlights: budgetEnforcedFallback.highlights,
          tips: budgetEnforcedFallback.tips,
          bestTimeToVisit: budgetEnforcedFallback.bestTimeToVisit,
          weatherInfo: budgetEnforcedFallback.weatherInfo,
        },
        aiGenerated: {
          model: "fallback",
          generatedAt: new Date(),
          prompt: "Fallback plan generation",
          responseTime: 100,
        },
        status: "generated",
      });

      await tripPlan.save();
      await tripPlan.populate("itinerary.accommodation.hotel");

      return tripPlan;
    } catch (error) {
      console.error("Fallback plan generation failed:", error);
      throw new Error("Failed to generate any trip plan");
    }
  }

  // Enhanced chatbot with Gemini
  async generateChatResponse(userMessage, userContext = {}) {
    try {
      const prompt = `You are a helpful travel assistant for StayWise.ai hotel booking platform. 
      Respond to this user query: "${userMessage}"
      
      User context: ${JSON.stringify(userContext)}
      
      Provide helpful, concise, and friendly travel advice. If they're asking about trips or hotels, guide them to use our trip planning or hotel search features. Keep responses under 150 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini chat response error:", error);
      return "I apologize, but I'm having trouble processing your request right now. Please try our trip planning feature or search for hotels directly!";
    }
  }
}

module.exports = GeminiTripPlanningAI;
