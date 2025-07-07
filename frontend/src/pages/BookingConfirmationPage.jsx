import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Common/Navigation";
import Footer from "../components/Common/Footer";

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { booking, hotel } = location.state || {};

  if (!booking || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">
            Booking information not found
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

  const calculateNights = () => {
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your reservation has been successfully completed.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-xl font-bold">Booking Details</h2>
            <p className="text-blue-100">Booking ID: {booking._id}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Hotel Information
                </h3>

                <div className="flex mb-6">
                  <img
                    src={
                      hotel.images?.main ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"
                    }
                    alt={hotel.name}
                    className="w-24 h-24 object-cover rounded-lg mr-4"
                  />
                  <div>
                    <h4 className="text-xl font-semibold">{hotel.name}</h4>
                    <p className="text-gray-600 mb-2">
                      {hotel.location?.address}
                    </p>
                    <p className="text-gray-600">
                      {hotel.location?.city}, {hotel.location?.state}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {hotel.rating?.average || 0} ({hotel.rating?.count || 0}{" "}
                        reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">
                    Guest Information
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {booking.guestDetails.firstName}{" "}
                      {booking.guestDetails.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {booking.guestDetails.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {booking.guestDetails.phone}
                    </p>
                    {booking.guestDetails.specialRequests && (
                      <p>
                        <span className="font-medium">Special Requests:</span>{" "}
                        {booking.guestDetails.specialRequests}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Reservation Details
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Type:</span>
                    <span className="font-medium">{booking.room.type}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">
                      {new Date(booking.checkIn).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">
                      {new Date(booking.checkOut).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {calculateNights()} nights
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{booking.guests}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking Status:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {booking.status || "Confirmed"}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">
                    Payment Information
                  </h4>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">
                        {booking.payment?.method || "Credit Card"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-medium">
                        {booking.payment?.transactionId}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {booking.payment?.status || "Completed"}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <span>Total Paid:</span>
                      <span className="text-green-600">
                        ₹{booking.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Important Information:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Please arrive at the hotel with a valid photo ID</li>
                <li>
                  • Check-in time is usually 2:00 PM and check-out time is 11:00
                  AM
                </li>
                <li>
                  • A confirmation email has been sent to{" "}
                  {booking.guestDetails.email}
                </li>
                <li>
                  • For any changes or cancellations, contact the hotel directly
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t">
              <button
                onClick={() => navigate("/hotels")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Book Another Hotel
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Back to Home
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                Print Confirmation
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingConfirmationPage;
