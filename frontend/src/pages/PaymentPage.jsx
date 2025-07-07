import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StripePaymentForm from "../components/Payment/PaymentForm";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import { bookingsAPI } from "../services/api";

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError("Invalid booking ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await bookingsAPI.getById(bookingId);
        if (response?.booking && response.booking.totalAmount) {
          setBooking(response.booking);
        } else {
          throw new Error("Invalid booking data received");
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load booking details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking || !booking.totalAmount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {error || "Invalid booking information"}
            </h2>
            <p className="text-gray-600 mb-6">
              Unable to process your payment at this time.
            </p>
            <button
              onClick={() => navigate("/hotels")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Back to Hotels
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatAmount = (amount) => {
    return typeof amount === "number" ? amount.toLocaleString() : "0";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Complete Your Payment
            </h1>

            {/* Booking Summary */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hotel</span>
                  <span className="font-medium">
                    {booking.hotel?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Type</span>
                  <span className="font-medium">
                    {booking.roomType || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">
                    {booking.checkIn
                      ? new Date(booking.checkIn).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">
                    {booking.checkOut
                      ? new Date(booking.checkOut).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">
                    {booking.guests?.adults || booking.numberOfGuests || 1}{" "}
                    Adults
                    {booking.guests?.children > 0 &&
                      `, ${booking.guests.children} Children`}
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-semibold">
                      Total Amount
                    </span>
                    <span className="text-gray-900 font-semibold">
                      ₹{formatAmount(booking.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe Payment Form */}
            <StripePaymentForm
              amount={booking.totalAmount}
              bookingId={booking._id}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentPage;
