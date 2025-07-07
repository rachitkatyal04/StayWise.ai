import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hotelsAPI, bookingsAPI } from "../services/api";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import { useAuth } from "../contexts/AuthContext";

const HotelDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [guestDetails, setGuestDetails] = useState({
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName: user?.lastName || user?.name?.split(" ")[1] || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const loadHotelDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await hotelsAPI.getById(id);
      setHotel(response.hotel);
    } catch (err) {
      console.error("Error loading hotel details:", err);
      setError("Failed to load hotel details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHotelDetails();
  }, [loadHotelDetails]);

  const handleGuestDetailsChange = (e) => {
    const { name, value } = e.target;
    setGuestDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBookNow = async () => {
    if (!user) {
      alert("Please login to book a hotel.");
      navigate("/login");
      return;
    }

    if (!selectedRoom || !checkIn || !checkOut) {
      alert("Please select a room and dates to continue.");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    // Validate guest details
    if (
      !guestDetails.firstName.trim() ||
      !guestDetails.lastName.trim() ||
      !guestDetails.email.trim() ||
      !guestDetails.phone.trim()
    ) {
      alert("Please fill in all guest details.");
      return;
    }

    try {
      const totalAmount = calculateTotalPrice();
      const bookingData = {
        hotelId: hotel._id,
        rooms: [
          {
            roomType: selectedRoom.type,
            quantity: 1,
          },
        ],
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests: {
          adults: guests,
          children: 0,
        },
        guestDetails: {
          firstName: guestDetails.firstName.trim(),
          lastName: guestDetails.lastName.trim(),
          email: guestDetails.email.trim(),
          phone: guestDetails.phone.trim(),
        },
        totalAmount: totalAmount,
      };

      console.log("Creating booking with data:", bookingData);
      const response = await bookingsAPI.create(bookingData);
      console.log("Booking created:", response);

      if (response.booking?._id) {
        navigate(`/payment/${response.booking._id}`);
      } else {
        throw new Error("Invalid booking response");
      }
    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Failed to create booking. Please try again.";
      alert(errorMessage);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = () => {
    if (!selectedRoom) return 0;
    const nights = calculateNights();
    return selectedRoom.basePrice * nights;
  };

  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="large" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">
            {error || "Hotel not found"}
          </p>
          <button
            onClick={() => navigate("/hotels")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Hotels
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hotel Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {hotel.name}
          </h1>
          <p className="text-gray-600 mb-4">{hotel.description}</p>
          <div className="flex items-center text-gray-700 mb-4">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {hotel.location?.address}, {hotel.location?.city}
            </span>
          </div>
        </div>

        {/* Booking Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Book Your Stay</h2>

          {/* Date and Guest Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Date
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} Guest{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room Selection */}
          <h3 className="text-lg font-semibold mb-4">Available Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {hotel.rooms && hotel.rooms.length > 0 ? (
              hotel.rooms.map((room) => (
                <div
                  key={room.type}
                  onClick={() => setSelectedRoom(room)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRoom?.type === room.type
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <h4 className="font-semibold">{room.type}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {room.description}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Max: {room.maxOccupancy} guests
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{room.basePrice.toLocaleString()}/night
                  </p>
                  {room.totalRooms && (
                    <p className="text-xs text-gray-500">
                      {room.totalRooms} rooms available
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">
                  No rooms available for this hotel.
                </p>
              </div>
            )}
          </div>

          {/* Guest Details Form */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Guest Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={guestDetails.firstName}
                  onChange={handleGuestDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={guestDetails.lastName}
                  onChange={handleGuestDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={guestDetails.email}
                  onChange={handleGuestDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={guestDetails.phone}
                  onChange={handleGuestDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10-digit phone number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          {selectedRoom && checkIn && checkOut && (
            <div className="bg-gray-50 rounded-lg p-4 mt-6 mb-6">
              <h4 className="font-semibold mb-2">Booking Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Room:</span>
                  <span>{selectedRoom.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nights:</span>
                  <span>{calculateNights()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₹{calculateTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Book Now Button */}
          <button
            onClick={handleBookNow}
            disabled={!selectedRoom || !checkIn || !checkOut}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              selectedRoom && checkIn && checkOut
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {!user ? "Login to Book" : "Book Now"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HotelDetailsPage;
