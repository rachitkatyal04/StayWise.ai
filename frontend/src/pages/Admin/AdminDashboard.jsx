import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalHotels: 0,
      totalBookings: 0,
      totalUsers: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
    },
    bookingsByStatus: [],
    recentBookings: [],
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      setError("Failed to fetch dashboard statistics");
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  const { stats, recentBookings = [], bookingsByStatus = [] } = dashboardData;

  // Helper function to get booking count by status
  const getBookingCountByStatus = (status) => {
    const statusData = bookingsByStatus.find((item) => item._id === status);
    return statusData ? statusData.count : 0;
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Total Hotels</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats?.totalHotels || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Total Bookings</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats?.totalBookings || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {stats?.totalUsers || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            ${(stats?.totalRevenue || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Booking Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-medium text-green-700">Confirmed</h3>
            <p className="text-2xl font-bold text-green-600">
              {getBookingCountByStatus("confirmed")}
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-700">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {getBookingCountByStatus("pending")}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="text-lg font-medium text-red-700">Cancelled</h3>
            <p className="text-2xl font-bold text-red-600">
              {getBookingCountByStatus("cancelled")}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/hotels/new"
            className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="mr-2">🏨</span>
            Add New Hotel
          </Link>
          <Link
            to="/admin/bookings"
            className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="mr-2">📅</span>
            Manage Bookings
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="mr-2">👥</span>
            Manage Users
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center justify-center p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="mr-2">📊</span>
            View Analytics
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div
              key={booking._id}
              className="flex items-center justify-between border-b pb-4"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {booking.user?.name || "Unknown User"} booked{" "}
                  {booking.hotel?.name || "Unknown Hotel"}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : booking.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {booking.status?.charAt(0).toUpperCase() +
                  booking.status?.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
