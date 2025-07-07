import React, { useState, useEffect } from "react";
import { hotelsAPI } from "../services/api";
import HotelCard from "../components/Hotel/HotelCard";
import SearchBar from "../components/Search/SearchBar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import { useNavigate } from "react-router-dom";

const HotelsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadAllHotels();
  }, []);

  const loadAllHotels = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Get all hotels with a high limit to show most hotels
      const response = await hotelsAPI.search({ limit: 50 });
      setHotels(response.hotels || []);
    } catch (err) {
      console.error("Error loading hotels:", err);
      setError("Failed to load hotels. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchData) => {
    const params = new URLSearchParams({
      city: searchData.destination,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: searchData.guests.toString(),
    });

    navigate(`/search-results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing Hotels
          </h1>
          <p className="text-xl mb-8">
            Find the perfect accommodation for your next adventure
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Hotels Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Hotels</h2>
          <p className="text-gray-600">
            Browse through our collection of premium hotels
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={loadAllHotels}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Hotels Grid */}
        {!isLoading && !error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}{" "}
                available
              </p>

              {/* Sort Options */}
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="rating">Sort by Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </div>

            {hotels.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hotels available
                </h3>
                <p className="text-gray-600 mb-4">
                  Please try again later or contact support.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <HotelCard key={hotel._id} hotel={hotel} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HotelsPage;
