import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const HotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    city: "",
    featured: "",
  });
  const [pagination, setPagination] = useState({});
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllHotels(filters);
      setHotels(data.hotels);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to fetch hotels");
      console.error("Hotels fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (hotelId) => {
    try {
      await adminAPI.deleteHotel(hotelId);
      setShowDeleteModal(false);
      setSelectedHotel(null);
      fetchHotels();
      alert("Hotel deleted successfully");
    } catch (err) {
      alert("Failed to delete hotel: " + err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Management</h1>
          <p className="text-gray-600">
            Manage all hotel listings and properties
          </p>
        </div>
        <Link
          to="/admin/hotels/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add New Hotel
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Hotels
            </label>
            <input
              type="text"
              placeholder="Search by name or city..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              placeholder="Filter by city..."
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured
            </label>
            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange("featured", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Hotels</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) =>
                handleFilterChange(
                  "limit",
                  e.target.value === "all" ? 1000 : parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={1000}>Show All</option>
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

      {/* Results Summary */}
      {!loading && hotels.length > 0 && (
        <div className="text-sm text-gray-600 mb-4">
          Showing {hotels.length} of {pagination.totalHotels || hotels.length}{" "}
          hotels
        </div>
      )}

      {/* Hotels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Range
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
              {hotels.map((hotel) => (
                <tr key={hotel._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={hotel.images.main}
                        alt={hotel.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {hotel.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {hotel.rooms.length} room types
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {hotel.location.city}, {hotel.location.state}
                    </div>
                    <div className="text-sm text-gray-500">
                      {hotel.location.pincode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {hotel.rating?.average || 0}
                      </span>
                      <span className="ml-1 text-yellow-400">★</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(
                        Math.min(...hotel.rooms.map((r) => r.basePrice))
                      )}{" "}
                      -{" "}
                      {formatCurrency(
                        Math.max(...hotel.rooms.map((r) => r.basePrice))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          hotel.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {hotel.isActive ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          hotel.featured
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {hotel.featured ? "Featured" : "Non-Featured"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <Link
                        to={`/admin/hotels/${hotel._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <Link
                        to={`/admin/hotels/${hotel._id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
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
                      pagination.totalHotels
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalHotels}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.currentPage === index + 1
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
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
      {!loading && hotels.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-xl mb-4">🏨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hotels found
          </h3>
          <p className="text-gray-500 mb-4">
            {filters.search || filters.city
              ? "Try adjusting your filters"
              : "Get started by adding your first hotel"}
          </p>
          <Link
            to="/admin/hotels/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add New Hotel
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delete Hotel
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedHotel?.name}"? This
                  action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedHotel(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedHotel._id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelManagement;
