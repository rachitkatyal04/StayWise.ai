import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "",
    hotel: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "confirmed",
      label: "Confirmed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "checked-in",
      label: "Checked In",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "checked-out",
      label: "Checked Out",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "no-show",
      label: "No Show",
      color: "bg-purple-100 text-purple-800",
    },
  ];

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllBookings(filters);
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to fetch bookings");
      console.error("Bookings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      setUpdatingStatus(true);
      await adminAPI.updateBookingStatus(
        selectedBooking._id,
        newStatus,
        statusReason
      );
      setShowStatusModal(false);
      setSelectedBooking(null);
      setNewStatus("");
      setStatusReason("");
      fetchBookings();
      alert("Booking status updated successfully");
    } catch (err) {
      alert("Failed to update booking status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    return statusOption ? statusOption.color : "bg-gray-100 text-gray-800";
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Management
            </h1>
            <p className="text-gray-600">
              Manage all hotel bookings and reservations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hotel
              </label>
              <input
                type="text"
                placeholder="Search by hotel name..."
                value={filters.hotel}
                onChange={(e) => handleFilterChange("hotel", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Page
              </label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange("limit", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{booking._id.slice(-6)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.roomType} •{" "}
                        {booking.guests?.adults || booking.numberOfGuests || 1}{" "}
                        guests
                        {booking.guests?.children > 0 &&
                          ` (${booking.guests.children} children)`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={
                            booking.hotel.images?.main ||
                            booking.hotel.images?.[0] ||
                            "/default-hotel.jpg"
                          }
                          alt={booking.hotel.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.hotel.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.hotel.location.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.checkIn)}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {formatDate(booking.checkOut)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.nights} nights
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(booking.pricing.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.payment.method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setNewStatus(booking.status);
                          setShowStatusModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() =>
                          window.open(`/booking/${booking._id}`, "_blank")
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * filters.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * filters.limit,
                        pagination.totalBookings
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {pagination.totalBookings}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(pagination.totalPages, 5))].map(
                      (_, index) => {
                        const pageNum = pagination.currentPage - 2 + index;
                        if (pageNum < 1 || pageNum > pagination.totalPages)
                          return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.currentPage === pageNum
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500">
              {Object.values(filters).some((v) => v)
                ? "Try adjusting your filters"
                : "No bookings have been made yet"}
            </p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Update Booking Status
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Booking #{selectedBooking._id.slice(-6)} -{" "}
                  {selectedBooking.hotel.name}
                </p>
                <p className="text-sm text-gray-600">
                  Guest: {selectedBooking.user.name}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason for status change..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedBooking(null);
                    setNewStatus("");
                    setStatusReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingManagement;
