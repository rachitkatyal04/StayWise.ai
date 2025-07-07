import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotelsAPI } from "../services/api";
import HotelCard from "../components/Hotel/HotelCard";
import SearchBar from "../components/Search/SearchBar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      try {
        setIsLoading(true);
        const hotels = await hotelsAPI.getFeatured(8);
        setFeaturedHotels(Array.isArray(hotels) ? hotels : []);
      } catch (err) {
        setError("Failed to load featured hotels");
        console.error("Featured hotels error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedHotels();
  }, []);

  const handleSearch = (searchData) => {
    const searchParams = new URLSearchParams({
      city: searchData.destination,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: searchData.guests.toString(),
    });

    navigate(`/search-results?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Hero Section */}
      <section className="hero-background h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to <span className="text-blue-400">StayWise.ai</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover amazing hotels across India with our smart booking platform
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} className="search-bar" />
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ⭐ Featured Hotels
            </h2>
            <p className="text-xl text-gray-600">
              Discover our hand-picked selection of premium hotels across India
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredHotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🏙️ Popular Destinations
            </h2>
            <p className="text-xl text-gray-600">
              Explore the most popular cities for hotel bookings
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              {
                name: "Mumbai",
                image:
                  "https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=300",
              },
              {
                name: "Delhi",
                image:
                  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300",
              },
              {
                name: "Bangalore",
                image:
                  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=300",
              },
              {
                name: "Chennai",
                image:
                  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
              },
              {
                name: "Goa",
                image:
                  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300",
              },
              {
                name: "Jaipur",
                image:
                  "https://images.unsplash.com/photo-1477587458883-47145ed94245?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
              },
            ].map((city) => (
              <div
                key={city.name}
                className="relative rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105 shadow-lg"
                onClick={() => navigate(`/search-results?city=${city.name}`)}
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <h3 className="text-white font-semibold text-lg">
                    {city.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose StayWise.ai?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-blue-600">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Safe and secure payment processing with Razorpay
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-600">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-gray-600">
                Quick and easy booking process with instant confirmation
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-purple-600">💯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Competitive pricing and exclusive deals on hotels
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-orange-600">📞</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer support for all your needs
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
