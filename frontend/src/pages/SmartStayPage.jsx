import React, { useState, useEffect } from "react";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import SmartStayRecommender from "../components/SmartStay/SmartStayRecommender";
import { recommendationsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/Common/LoadingSpinner";

const SmartStayPage = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [insightsResponse, preferencesResponse] = await Promise.all([
        recommendationsAPI.getInsights(),
        recommendationsAPI.getPreferences(),
      ]);

      setInsights(insightsResponse.insights);
      setPreferences(preferencesResponse.preferences);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTravelStyleIcon = (style) => {
    const icons = {
      luxury: "💎",
      budget: "💰",
      "mid-range": "🏨",
      adventure: "🏔️",
      business: "💼",
      family: "👨‍👩‍👧‍👦",
      romantic: "💕",
    };
    return icons[style] || "🌟";
  };

  const getLoyaltyIcon = (level) => {
    const icons = {
      Diamond: "💎",
      Gold: "🥇",
      Silver: "🥈",
      Bronze: "🥉",
      Explorer: "🗺️",
    };
    return icons[level] || "🌟";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SmartStay AI Recommender
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover perfect hotels tailored just for you! Our AI analyzes your
            preferences, booking history, and travel patterns to suggest
            accommodations you'll absolutely love.
          </p>
        </div>

        {/* User Insights Dashboard */}
        {user && !loading && insights && preferences && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Travel Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Travel Style */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">
                    {getTravelStyleIcon(preferences.travelStyle)}
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Travel Style</div>
                    <div className="text-lg font-semibold text-gray-900 capitalize">
                      {preferences.travelStyle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loyalty Level */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">
                    {getLoyaltyIcon(insights.loyaltyLevel)}
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Loyalty Level</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {insights.loyaltyLevel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📊</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Bookings</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {insights.totalBookings}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Accuracy */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🎯</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">AI Accuracy</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {insights.recommendationAccuracy}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Locations */}
            {insights.favoriteLocations &&
              insights.favoriteLocations.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Favorite Destinations
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {insights.favoriteLocations.map((location, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                      >
                        📍 {location.city}, {location.state} ({location.count}{" "}
                        visits)
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Guest Welcome */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🌟 Welcome, Traveler!
            </h2>
            <p className="text-gray-600 mb-6">
              Sign up to unlock personalized AI recommendations based on your
              unique travel preferences. Meanwhile, check out our trending picks
              below!
            </p>
            <button
              onClick={() => (window.location.href = "/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Create Account for Personalized Recommendations
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Main Recommendations */}
        {!loading && (
          <div>
            <SmartStayRecommender showTitle={false} limit={12} />
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How SmartStay AI Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Learn Your Preferences
              </h3>
              <p className="text-gray-600">
                AI analyzes your search history, bookings, and interactions to
                understand your travel style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Matching
              </h3>
              <p className="text-gray-600">
                Advanced algorithms match you with hotels based on location,
                price, amenities, and seasonal trends.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Perfect Recommendations
              </h3>
              <p className="text-gray-600">
                Get personalized suggestions that improve over time as you book
                and provide feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Personalized Matching
            </h3>
            <p className="text-sm text-gray-600">
              AI-powered recommendations based on your unique preferences
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Behavioral Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Learning from your searches, views, and booking patterns
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="text-3xl mb-3">🌟</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Seasonal Trends
            </h3>
            <p className="text-sm text-gray-600">
              Recommendations that adapt to current season and trends
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Continuous Learning
            </h3>
            <p className="text-sm text-gray-600">
              Gets smarter with every interaction and feedback you provide
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SmartStayPage;
