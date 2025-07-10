import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TripPlannerForm from "../components/TripPlanner/TripPlannerForm";
import TripItinerary from "../components/TripPlanner/TripItinerary";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import { useAuth } from "../contexts/AuthContext";
import { tripPlanningAPI } from "../services/api";

const TripPlannerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("form"); // 'form', 'itinerary', 'myTrips'
  const [currentTrip, setCurrentTrip] = useState(null);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingTripId, setDeletingTripId] = useState(null);

  useEffect(() => {
    if (user && currentView === "myTrips") {
      loadMyTrips();
    }
  }, [user, currentView]);

  const loadMyTrips = async () => {
    try {
      setLoading(true);
      const response = await tripPlanningAPI.getMyTrips();
      setMyTrips(response.trips || []);
    } catch (error) {
      console.error("Error loading trips:", error);
      setError("Failed to load your trips");
    } finally {
      setLoading(false);
    }
  };

  const handleTripGenerated = (tripPlan) => {
    setCurrentTrip(tripPlan);
    setCurrentView("itinerary");
  };

  const handleEditTrip = () => {
    setCurrentView("form");
  };

  const handleBookHotels = (tripPlan) => {
    console.log("🏨 Book Hotels clicked for trip:", tripPlan.destination.city);

    // Navigate to hotels page for the destination with trip dates
    const searchParams = new URLSearchParams({
      city: tripPlan.destination.city,
      state: tripPlan.destination.state,
      checkIn: tripPlan.dates.startDate,
      checkOut: tripPlan.dates.endDate,
      guests: tripPlan.travelers.adults + tripPlan.travelers.children,
      tripPlanner: "true", // Flag to indicate this came from trip planner
    });

    navigate(`/hotels?${searchParams.toString()}`, {
      state: {
        tripPlan,
        suggestedHotels: tripPlan.itinerary
          .filter((day) => day.accommodation)
          .map((day) => day.accommodation.hotelName)
          .filter(Boolean),
      },
    });
  };

  const handleRegenerateTrip = async (tripId) => {
    try {
      setLoading(true);
      const response = await tripPlanningAPI.regenerateTrip(tripId, {
        preferences: {
          interests: ["culture", "food"], // You can modify this based on user input
        },
      });

      if (response.success) {
        setCurrentTrip(response.tripPlan);
        setCurrentView("itinerary");
      }
    } catch (error) {
      console.error("Error regenerating trip:", error);
      setError("Failed to regenerate trip plan");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrip = async (tripId) => {
    try {
      setLoading(true);
      const response = await tripPlanningAPI.getTripById(tripId);
      setCurrentTrip(response.trip);
      setCurrentView("itinerary");
    } catch (error) {
      console.error("Error loading trip:", error);
      setError("Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId, tripName) => {
    // Confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the trip to "${tripName}"?\n\nThis action cannot be undone.`
    );

    if (!isConfirmed) return;

    try {
      setDeletingTripId(tripId);
      await tripPlanningAPI.deleteTrip(tripId);

      // Remove the trip from local state
      setMyTrips((prevTrips) =>
        prevTrips.filter((trip) => trip._id !== tripId)
      );

      // Clear any previous errors and show success
      setError("");
      alert("Trip deleted successfully!");
    } catch (error) {
      console.error("Error deleting trip:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete trip";
      setError(errorMessage);
    } finally {
      setDeletingTripId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      generated: "bg-blue-100 text-blue-800",
      customized: "bg-purple-100 text-purple-800",
      booked: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center pt-16">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Login Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please login to access our AI Trip Planner and create amazing
              personalized itineraries
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Login Now
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-8 pt-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🤖 AI Trip Planner
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by Google Gemini AI • Create personalized itineraries with
              hotels, attractions, and detailed day-by-day plans
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setCurrentView("form")}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  currentView === "form"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🚀 Create New Trip
              </button>
              <button
                onClick={() => setCurrentView("myTrips")}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  currentView === "myTrips"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📋 My Trips
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-400 text-xl mr-3">⚠️</span>
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={() => setError("")}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 mt-4">Processing your request...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <>
              {/* Trip Planning Form */}
              {currentView === "form" && (
                <div className="space-y-6">
                  {currentTrip && (
                    <div className="text-center">
                      <button
                        onClick={() => setCurrentView("itinerary")}
                        className="text-blue-600 hover:text-blue-800 underline mb-4"
                      >
                        ← Back to Generated Trip
                      </button>
                    </div>
                  )}
                  <TripPlannerForm onTripGenerated={handleTripGenerated} />
                </div>
              )}

              {/* Trip Itinerary */}
              {currentView === "itinerary" && currentTrip && (
                <div className="space-y-6">
                  <div className="text-center">
                    <button
                      onClick={() => setCurrentView("form")}
                      className="text-blue-600 hover:text-blue-800 underline mb-4"
                    >
                      ← Create New Trip
                    </button>
                  </div>
                  <TripItinerary
                    tripPlan={currentTrip}
                    onEdit={handleEditTrip}
                    onBook={handleBookHotels}
                    onRegenerateTrip={handleRegenerateTrip}
                  />
                </div>
              )}

              {/* My Trips */}
              {currentView === "myTrips" && (
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      📋 My Trips
                    </h2>
                    <button
                      onClick={() => setCurrentView("form")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      🚀 Create New Trip
                    </button>
                  </div>

                  {myTrips.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                      <div className="text-6xl mb-4">🗺️</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        No trips yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start planning your first AI-powered trip and create
                        amazing memories!
                      </p>
                      <button
                        onClick={() => setCurrentView("form")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Create Your First Trip
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myTrips.map((trip) => (
                        <div
                          key={trip._id}
                          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold text-gray-900">
                                {trip.destination.city}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleDeleteTrip(
                                      trip._id,
                                      trip.destination.city
                                    )
                                  }
                                  disabled={deletingTripId === trip._id}
                                  className={`p-2 rounded-full transition-colors ${
                                    deletingTripId === trip._id
                                      ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                      : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                  }`}
                                  title={
                                    deletingTripId === trip._id
                                      ? "Deleting..."
                                      : "Delete Trip"
                                  }
                                >
                                  {deletingTripId === trip._id ? "⏳" : "🗑️"}
                                </button>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    trip.status
                                  )}`}
                                >
                                  {trip.status}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">📍</span>
                                <span className="text-sm">
                                  {trip.destination.state}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">📅</span>
                                <span className="text-sm">
                                  {trip.duration.days} days,{" "}
                                  {trip.duration.nights} nights
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">💰</span>
                                <span className="text-sm font-medium">
                                  {formatCurrency(trip.summary.totalCost)}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">🤖</span>
                                <span className="text-sm">
                                  AI Score: {trip.summary.aiConfidenceScore}%
                                </span>
                              </div>
                            </div>

                            {trip.summary.highlights &&
                              trip.summary.highlights.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    Highlights:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {trip.summary.highlights
                                      .slice(0, 2)
                                      .map((highlight, index) => (
                                        <span
                                          key={index}
                                          className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                                        >
                                          {highlight}
                                        </span>
                                      ))}
                                    {trip.summary.highlights.length > 2 && (
                                      <span className="text-gray-500 text-xs">
                                        +{trip.summary.highlights.length - 2}{" "}
                                        more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                            <div className="space-y-2">
                              <button
                                onClick={() => handleViewTrip(trip._id)}
                                disabled={deletingTripId === trip._id}
                                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                  deletingTripId === trip._id
                                    ? "bg-gray-400 cursor-not-allowed text-gray-100"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                              >
                                View Itinerary
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleRegenerateTrip(trip._id)}
                                  disabled={deletingTripId === trip._id}
                                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                    deletingTripId === trip._id
                                      ? "bg-gray-400 cursor-not-allowed text-gray-100"
                                      : "bg-purple-600 hover:bg-purple-700 text-white"
                                  }`}
                                >
                                  🔄 Regenerate
                                </button>
                                <button
                                  onClick={() => handleBookHotels(trip)}
                                  disabled={deletingTripId === trip._id}
                                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                    deletingTripId === trip._id
                                      ? "bg-gray-400 cursor-not-allowed text-gray-100"
                                      : "bg-green-600 hover:bg-green-700 text-white"
                                  }`}
                                >
                                  🏨 Book
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 px-6 py-3">
                            <div className="text-xs text-gray-500">
                              Created:{" "}
                              {new Date(trip.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Features Section */}
          {currentView === "form" && !currentTrip && (
            <div className="max-w-6xl mx-auto mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Why Choose Our AI Trip Planner?
                </h2>
                <p className="text-gray-600 text-lg">
                  Powered by cutting-edge Google Gemini AI technology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    AI-Powered Intelligence
                  </h3>
                  <p className="text-gray-600">
                    Advanced Gemini AI analyzes your preferences, budget, and
                    travel style to create perfectly personalized itineraries.
                  </p>
                </div>

                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Instant Generation
                  </h3>
                  <p className="text-gray-600">
                    Get detailed day-by-day itineraries with hotels, activities,
                    meals, and costs in under 30 seconds.
                  </p>
                </div>

                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Hyper-Personalized
                  </h3>
                  <p className="text-gray-600">
                    Every itinerary is unique, considering your interests,
                    budget, travel dates, and group size.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default TripPlannerPage;
