import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { hotelsAPI } from "../services/api";
import HotelCard from "../components/Hotel/HotelCard";
import SearchBar from "../components/Search/SearchBar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";

const SearchResultsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const params = {
      city: urlParams.get("city") || "",
      checkIn: urlParams.get("checkIn") || "",
      checkOut: urlParams.get("checkOut") || "",
      guests: parseInt(urlParams.get("guests")) || 1,
    };

    setSearchParams(params);
    searchHotels(params);
  }, [location.search]);

  const searchHotels = async (params) => {
    try {
      setIsLoading(true);
      setError("");

      // Clean up params - remove empty strings to avoid validation errors
      const cleanParams = {};
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== "" &&
          params[key] !== null &&
          params[key] !== undefined
        ) {
          cleanParams[key] = params[key];
        }
      });

      // Call the search API endpoint
      const response = await hotelsAPI.search(cleanParams);
      setHotels(response.hotels || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search hotels. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = (searchData) => {
    const newParams = new URLSearchParams({
      city: searchData.destination,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: searchData.guests.toString(),
    });

    navigate(`/search-results?${newParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar onSearch={handleNewSearch} initialValues={searchParams} />
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Summary */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {searchParams.city
              ? `Hotels in ${searchParams.city}`
              : "Search Results"}
          </h1>
          {searchParams.checkIn && searchParams.checkOut ? (
            <p className="text-gray-600">
              {new Date(searchParams.checkIn).toLocaleDateString()} -{" "}
              {new Date(searchParams.checkOut).toLocaleDateString()} •{" "}
              {searchParams.guests}{" "}
              {searchParams.guests === 1 ? "Guest" : "Guests"}
            </p>
          ) : searchParams.city ? (
            <p className="text-gray-600">
              Browse all available hotels • {searchParams.guests}{" "}
              {searchParams.guests === 1 ? "Guest" : "Guests"}
            </p>
          ) : null}
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
              onClick={() => searchHotels(searchParams)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"} found
              </p>

              {/* Sort Options - can be expanded later */}
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
                  No hotels found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or explore different
                  destinations.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Back to Home
                </button>
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

export default SearchResultsPage;
