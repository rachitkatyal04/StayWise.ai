import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recommendationsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";

const SmartStayRecommender = ({
  location = null,
  showTitle = true,
  limit = 6,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        let response;
        if (user) {
          // Get personalized recommendations for logged-in users
          response = await recommendationsAPI.getPersonalized({
            location,
            limit,
            excludeBookedHotels: true,
          });

          // Also fetch user preferences
          try {
            const prefResponse = await recommendationsAPI.getPreferences();
            setPreferences(prefResponse.preferences);
          } catch (err) {
            console.error("Preferences fetch error:", err);
          }
        } else {
          // Get trending recommendations for guests
          response = await recommendationsAPI.getTrending(location, limit);
        }

        setRecommendations(response.recommendations || []);
      } catch (err) {
        console.error("Recommendations fetch error:", err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, location, limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");

      let response;
      if (user) {
        response = await recommendationsAPI.getPersonalized({
          location,
          limit,
          excludeBookedHotels: true,
        });
      } else {
        response = await recommendationsAPI.getTrending(location, limit);
      }

      setRecommendations(response.recommendations || []);
    } catch (err) {
      console.error("Recommendations fetch error:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = async (hotel) => {
    // Track user interaction
    if (user) {
      try {
        await recommendationsAPI.trackInteraction("hotel_view", {
          hotelId: hotel._id,
        });

        await recommendationsAPI.submitFeedback(
          hotel._id,
          "liked",
          true,
          false
        );
      } catch (err) {
        console.error("Tracking error:", err);
      }
    }

    navigate(`/hotel/${hotel._id}`);
  };

  const handleFeedback = async (hotel, feedback) => {
    if (!user) return;

    try {
      await recommendationsAPI.submitFeedback(hotel._id, feedback);
      // Optionally refresh recommendations based on feedback
      if (feedback === "disliked") {
        fetchRecommendations();
      }
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className="w-4 h-4 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          className="w-4 h-4 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id="half-fill">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-fill)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Recommendations Available
        </h3>
        <p className="text-gray-600">
          Start exploring hotels to get personalized recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg
                className="w-8 h-8 text-blue-600 mr-3"
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
              SmartStay Recommender
            </h2>
            <p className="text-gray-600 mt-1">
              {user
                ? `Personalized recommendations based on your preferences${
                    preferences?.travelStyle
                      ? ` • ${preferences.travelStyle} traveler`
                      : ""
                  }`
                : "Trending hotels loved by travelers"}
            </p>
          </div>

          {user && preferences && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Your Style</div>
              <div className="text-lg font-semibold text-blue-600 capitalize">
                {preferences.travelStyle || "Explorer"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation, index) => {
          const { hotel, score, reasons } = recommendation;
          return (
            <div
              key={hotel._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleHotelClick(hotel)}
            >
              {/* AI Badge */}
              <div className="relative">
                <img
                  src={
                    hotel.images?.main ||
                    hotel.images?.[0] ||
                    "/default-hotel.jpg"
                  }
                  alt={hotel.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI Pick
                  </div>
                </div>

                {/* Match Score */}
                {user && score && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {Math.round(score)}% Match
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* Hotel Info */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {hotel.name}
                  </h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(hotel.rooms?.[0]?.basePrice || 5000)}
                    </div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-2">
                  {hotel.location?.city}, {hotel.location?.state}
                </p>

                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex mr-2">
                    {renderStars(
                      typeof hotel.rating === "number"
                        ? hotel.rating
                        : hotel.rating?.average || 4
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {typeof hotel.rating === "number"
                      ? hotel.rating
                      : hotel.rating?.average || 4}
                    /5 ({hotel.reviews?.length || hotel.rating?.count || 0}{" "}
                    reviews)
                  </span>
                </div>

                {/* AI Reasons */}
                {reasons && reasons.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-purple-600 mb-1">
                      Why we recommend this:
                    </div>
                    <div className="space-y-1">
                      {reasons.slice(0, 2).map((reason, i) => (
                        <div
                          key={i}
                          className="text-xs text-gray-600 flex items-center"
                        >
                          <svg
                            className="w-3 h-3 text-purple-500 mr-1 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities Preview */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {hotel.amenities.slice(0, 3).map((amenity, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{hotel.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Feedback Buttons */}
                {user && (
                  <div className="flex justify-center space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(hotel, "liked");
                      }}
                      className="flex items-center text-green-600 hover:text-green-700 text-xs font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      Perfect
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(hotel, "disliked");
                      }}
                      className="flex items-center text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                      </svg>
                      Not for me
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View More Button */}
      {recommendations.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => navigate("/hotels")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Explore More Hotels
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartStayRecommender;
