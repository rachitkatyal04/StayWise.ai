import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bookingData = location.state;

  console.log("Received Booking Data:", bookingData);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to book a hotel room.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Go to Login
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!bookingData || !bookingData.hotel || !bookingData.room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Invalid Booking
          </h2>
          <p className="text-gray-600 mb-6">
            Please select a hotel and room before proceeding with booking.
          </p>
          <button
            onClick={() => navigate("/hotels")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Hotels
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const calculateNights = () => {
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleConfirmBooking = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.post("/bookings", {
        hotelId: bookingData.hotel._id,
        roomId: bookingData.room._id,
        roomType: bookingData.room.type,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numberOfGuests: bookingData.guests,
        totalAmount: bookingData.room.basePrice * calculateNights(),
      });

      // Redirect to payment page with the booking ID
      navigate(`/payment/${response.data._id}`);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Complete Your Booking
        </h1>

        {/* Hotel Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Hotel Information</h2>
          <div className="space-y-2">
            <p className="text-lg font-medium">{bookingData.hotel.name}</p>
            <p className="text-gray-600">
              {bookingData.hotel.location?.address}
            </p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Room Type</span>
              <span className="font-medium">{bookingData.room.type}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Check-in</span>
              <span className="font-medium">
                {new Date(bookingData.checkIn).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Check-out</span>
              <span className="font-medium">
                {new Date(bookingData.checkOut).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Number of Nights</span>
              <span className="font-medium">{calculateNights()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Guests</span>
              <span className="font-medium">{bookingData.guests}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Price per Night</span>
              <span className="font-medium">
                ₹{bookingData.room.basePrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 pt-4">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-lg font-bold text-blue-600">
                ₹
                {(
                  bookingData.room.basePrice * calculateNights()
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg text-white font-medium ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Proceed to Payment"
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;
