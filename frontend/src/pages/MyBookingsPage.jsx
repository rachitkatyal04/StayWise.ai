import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { bookingsAPI } from "../services/api";

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchMyBookings = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching user bookings...");
        console.log("User:", user);
        console.log("Token:", localStorage.getItem("token"));

        const response = await bookingsAPI.getUserBookings();
        console.log("API Response:", response);
        setBookings(response.bookings || []);

        if (!response.bookings || response.bookings.length === 0) {
          console.log("No bookings found in response");
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError(
          `Failed to load your bookings: ${
            err.response?.data?.message || err.message || "Please try again."
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [user, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "checked-out":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      await bookingsAPI.cancel(selectedBooking._id, cancelReason);

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking._id === selectedBooking._id
            ? { ...booking, status: "cancelled" }
            : booking
        )
      );

      // Close modal and reset
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason("");

      // Show success message
      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(
        `Failed to cancel booking: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setCancelling(false);
    }
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedBooking(null);
    setCancelReason("");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your bookings.
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all your hotel reservations
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't made any hotel bookings yet. Start exploring our
              amazing hotels and make your first reservation!
            </p>
            <div className="space-y-3 sm:space-y-0 sm:space-x-3 sm:flex sm:justify-center">
              <button
                onClick={() => navigate("/hotels")}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Book Now
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors"
              >
                Explore Hotels
              </button>
            </div>
          </div>
        ) : (
          // Bookings List
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.hotel?.name || "Hotel Name"}
                      </h3>
                      <p className="text-gray-600">
                        {booking.hotel?.location?.city},{" "}
                        {booking.hotel?.location?.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                      <p className="text-gray-500 text-sm mt-1">
                        Booking ID: {booking.bookingId || booking._id.slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Check-in
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(booking.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Check-out
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(booking.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Duration
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {calculateNights(booking.checkIn, booking.checkOut)}{" "}
                        night
                        {calculateNights(booking.checkIn, booking.checkOut) > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Room Type
                      </p>
                      <p className="text-gray-900">
                        {booking.roomType || "Standard Room"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Guests
                      </p>
                      <p className="text-gray-900">
                        {booking.guests?.adults || booking.numberOfGuests || 1}{" "}
                        Adult
                        {(booking.guests?.adults ||
                          booking.numberOfGuests ||
                          1) > 1
                          ? "s"
                          : ""}
                        {booking.guests?.children > 0 &&
                          `, ${booking.guests.children} Child${
                            booking.guests.children > 1 ? "ren" : ""
                          }`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Amount
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        ₹
                        {(
                          booking.pricing?.totalAmount ||
                          booking.totalAmount ||
                          0
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Booked on {formatDate(booking.createdAt)}
                    </div>
                    <div className="space-x-3">
                      {(booking.status === "confirmed" ||
                        booking.status === "pending") &&
                        new Date(booking.checkIn) > new Date() && (
                          <button
                            onClick={() => openCancelModal(booking)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Cancel Booking
                          </button>
                        )}
                      <button
                        onClick={() => navigate(`/hotel/${booking.hotel?._id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Hotel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cancel Booking
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to cancel your booking for{" "}
                  <span className="font-medium">
                    {selectedBooking?.hotel?.name}
                  </span>
                  ?
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Check-in:{" "}
                  {selectedBooking && formatDate(selectedBooking.checkIn)}
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="3"
                  maxLength="200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cancelReason.length}/200 characters
                </p>
              </div>

              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
                  disabled={cancelling}
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyBookingsPage;
