import React, { useState } from "react";
import { tripPlanningAPI } from "../../services/api";
import LoadingSpinner from "../Common/LoadingSpinner";

const TripPlannerForm = ({ onTripGenerated }) => {
  const [formData, setFormData] = useState({
    destination: { city: "", state: "" },
    duration: { days: 3, nights: 2 },
    dates: { startDate: "", endDate: "" },
    travelers: { adults: 1, children: 0 },
    preferences: {
      budget: { min: 0, max: "" },
      interests: [],
      travelStyle: "mid-range",
      accommodation: "hotel",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const interestOptions = [
    {
      value: "culture",
      label: "🏛️ Culture & Heritage",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "adventure",
      label: "🏔️ Adventure",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "relaxation",
      label: "🧘 Relaxation",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "food",
      label: "🍛 Food & Cuisine",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "nature",
      label: "🌿 Nature",
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "shopping",
      label: "🛍️ Shopping",
      color: "bg-pink-100 text-pink-800",
    },
    {
      value: "nightlife",
      label: "🌃 Nightlife",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "history",
      label: "📚 History",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "spiritual",
      label: "🕉️ Spiritual",
      color: "bg-amber-100 text-amber-800",
    },
    {
      value: "photography",
      label: "📸 Photography",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const popularDestinations = [
    { city: "Goa", state: "Goa", icon: "🏖️" },
    { city: "Jaipur", state: "Rajasthan", icon: "🏰" },
    { city: "Mumbai", state: "Maharashtra", icon: "🏙️" },
    { city: "Delhi", state: "Delhi", icon: "🏛️" },
    { city: "Bangalore", state: "Karnataka", icon: "🌆" },
    { city: "Kerala", state: "Kerala", icon: "🌴" },
    { city: "Manali", state: "Himachal Pradesh", icon: "🏔️" },
    { city: "Udaipur", state: "Rajasthan", icon: "🏰" },
  ];

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const fieldParts = field.split(".");

      if (fieldParts.length === 2) {
        // Handle two-level nesting: "parent.child"
        const [parent, child] = fieldParts;
        setFormData((prev) => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value },
        }));
      } else if (fieldParts.length === 3) {
        // Handle three-level nesting: "parent.child.grandchild"
        const [parent, child, grandchild] = fieldParts;
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value,
            },
          },
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleDestinationSelect = (destination) => {
    setFormData((prev) => ({
      ...prev,
      destination: { city: destination.city, state: destination.state },
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests.includes(interest)
          ? prev.preferences.interests.filter((i) => i !== interest)
          : [...prev.preferences.interests, interest],
      },
    }));
  };

  const handleDurationChange = (days) => {
    const nights = Math.max(0, days - 1);
    setFormData((prev) => ({
      ...prev,
      duration: { days: parseInt(days), nights },
    }));
  };

  const calculateEndDate = (startDate, days) => {
    if (!startDate || !days) return "";
    const start = new Date(startDate);
    const end = new Date(start.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    return end.toISOString().split("T")[0];
  };

  const handleStartDateChange = (startDate) => {
    const endDate = calculateEndDate(startDate, formData.duration.days);
    setFormData((prev) => ({
      ...prev,
      dates: { startDate, endDate },
    }));
  };

  const validateForm = () => {
    if (
      !formData.destination.city?.trim() ||
      !formData.destination.state?.trim()
    ) {
      setError("Please enter both city and state for your destination");
      return false;
    }
    if (!formData.dates.startDate || !formData.dates.endDate) {
      setError("Please select travel dates");
      return false;
    }

    const budgetMax = Number(formData.preferences.budget.max);
    if (isNaN(budgetMax) || budgetMax < 1000) {
      setError("Please enter a budget of at least ₹1,000");
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day
    const startDate = new Date(formData.dates.startDate);

    if (startDate <= today) {
      setError("Start date must be in the future");
      return false;
    }

    if (formData.duration.days < 1 || formData.duration.days > 30) {
      setError("Trip duration must be between 1 and 30 days");
      return false;
    }

    if (formData.travelers.adults < 1) {
      setError("At least one adult traveler is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("🚀 Generating trip plan with Gemini AI...");

      // Convert date strings to Date objects for backend
      const tripData = {
        ...formData,
        dates: {
          startDate: new Date(formData.dates.startDate),
          endDate: new Date(formData.dates.endDate),
        },
      };

      const response = await tripPlanningAPI.generateTrip(tripData);

      if (response.success) {
        onTripGenerated(response.tripPlan);
      } else {
        setError(response.message || "Failed to generate trip plan");
      }
    } catch (err) {
      console.error("Trip generation error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to generate trip plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getBudgetSuggestion = (travelStyle, days) => {
    const baseCost = {
      budget: 2000,
      "mid-range": 4000,
      luxury: 8000,
      backpacker: 1500,
      family: 5000,
      romantic: 6000,
    };
    return (baseCost[travelStyle] || 4000) * days;
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <h2 className="text-3xl font-bold mb-2">🤖 AI Trip Planner</h2>
        <p className="text-blue-100">
          Let our Gemini AI create your perfect personalized itinerary
        </p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Destination Selection */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              📍 Where do you want to go?
            </h3>

            {/* Popular Destinations Quick Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularDestinations.map((dest) => (
                <button
                  key={`${dest.city}-${dest.state}`}
                  type="button"
                  onClick={() => handleDestinationSelect(dest)}
                  className={`p-6 rounded-lg border text-center transition-all hover:shadow-md ${
                    formData.destination.city === dest.city
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-3xl mb-2">{dest.icon}</div>
                  <div className="text-base font-medium">{dest.city}</div>
                  <div className="text-sm text-gray-500">{dest.state}</div>
                </button>
              ))}
            </div>

            {/* Custom Destination Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  City
                </label>
                <input
                  type="text"
                  value={formData.destination.city}
                  onChange={(e) =>
                    handleInputChange("destination.city", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="e.g., Goa, Jaipur, Mumbai"
                  required
                />
              </div>
              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  State
                </label>
                <input
                  type="text"
                  value={formData.destination.state}
                  onChange={(e) =>
                    handleInputChange("destination.state", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="e.g., Rajasthan, Maharashtra"
                  required
                />
              </div>
            </div>
          </div>

          {/* Duration & Dates */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              📅 When and for how long?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Trip Duration
                </label>
                <select
                  value={formData.duration.days}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {[...Array(14)].map((_, i) => {
                    const days = i + 1;
                    const nights = Math.max(0, days - 1);
                    return (
                      <option key={days} value={days}>
                        {days} day{days > 1 ? "s" : ""}{" "}
                        {nights > 0 &&
                          `, ${nights} night${nights > 1 ? "s" : ""}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.dates.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>

              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.dates.endDate}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Travelers */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              👥 Who's traveling?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Adults
                </label>
                <select
                  value={formData.travelers.adults}
                  onChange={(e) =>
                    handleInputChange(
                      "travelers.adults",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Adult{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Children
                </label>
                <select
                  value={formData.travelers.children}
                  onChange={(e) =>
                    handleInputChange(
                      "travelers.children",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {[...Array(6)].map((_, i) => (
                    <option key={i} value={i}>
                      {i} Child{i !== 1 ? "ren" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget & Travel Style */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              💰 Budget & Travel Style
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Style
                </label>
                <select
                  value={formData.preferences.travelStyle}
                  onChange={(e) => {
                    const style = e.target.value;
                    // Only auto-suggest budget if user hasn't set a custom value
                    const currentBudget = formData.preferences.budget.max;
                    const isDefaultBudget =
                      !currentBudget || currentBudget === ""; // Empty by default

                    if (isDefaultBudget) {
                      const suggestedBudget = getBudgetSuggestion(
                        style,
                        formData.duration.days
                      );
                      setFormData((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          travelStyle: style,
                          budget: {
                            ...prev.preferences.budget,
                            max: suggestedBudget,
                          },
                        },
                      }));
                    } else {
                      // Just update travel style, keep user's budget
                      setFormData((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          travelStyle: style,
                        },
                      }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="budget">💰 Budget Traveler</option>
                  <option value="mid-range">🏨 Mid-range Comfort</option>
                  <option value="luxury">✨ Luxury Experience</option>
                  <option value="backpacker">🎒 Backpacker</option>
                  <option value="family">👨‍👩‍👧‍👦 Family Friendly</option>
                  <option value="romantic">💕 Romantic Getaway</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  value={formData.preferences.budget.max}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Store as integer or empty string
                    const numValue = value === "" ? "" : parseInt(value, 10);
                    handleInputChange("preferences.budget.max", numValue);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your budget"
                  min="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accommodation Type
                </label>
                <select
                  value={formData.preferences.accommodation}
                  onChange={(e) =>
                    handleInputChange(
                      "preferences.accommodation",
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hotel">🏨 Hotel</option>
                  <option value="resort">🏖️ Resort</option>
                  <option value="hostel">🎒 Hostel</option>
                  <option value="apartment">🏠 Apartment</option>
                  <option value="guesthouse">🏡 Guesthouse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              🎯 What interests you?
            </h3>
            <p className="text-gray-600 text-sm">
              Select all that apply to personalize your itinerary
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {interestOptions.map((interest) => (
                <label
                  key={interest.value}
                  className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:shadow-md ${
                    formData.preferences.interests.includes(interest.value)
                      ? `${interest.color} border-current`
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.preferences.interests.includes(
                      interest.value
                    )}
                    onChange={() => handleInterestToggle(interest.value)}
                    className="sr-only"
                  />
                  <div className="text-sm font-medium">{interest.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-400">⚠️</div>
                <p className="ml-2 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-3">
                    🤖 AI is crafting your perfect trip...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">🚀</span>
                  Generate My AI Trip Plan
                </>
              )}
            </button>

            {loading && (
              <p className="text-center text-gray-500 text-sm mt-2">
                This may take 10-30 seconds as our AI analyzes the best options
                for you
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripPlannerForm;
