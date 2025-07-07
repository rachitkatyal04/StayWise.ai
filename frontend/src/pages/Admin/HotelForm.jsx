import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const HotelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: {
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
    amenities: [],
    rooms: [
      {
        type: "Single",
        description: "",
        basePrice: "",
        maxOccupancy: 1,
        amenities: [],
        totalRooms: "",
        availableRooms: "",
      },
    ],
    policies: {
      checkIn: "14:00",
      checkOut: "12:00",
      cancellation: "Free cancellation up to 24 hours before check-in",
    },
    contact: {
      phone: "",
      email: "",
    },
    featured: false,
    isActive: true,
  });

  const amenitiesList = [
    "WiFi",
    "Parking",
    "Pool",
    "Gym",
    "Spa",
    "Restaurant",
    "Room Service",
    "Laundry",
    "Air Conditioning",
    "TV",
    "Mini Bar",
    "Balcony",
    "Sea View",
    "Mountain View",
    "Pet Friendly",
    "Business Center",
    "Conference Room",
    "Elevator",
    "Garden",
    "Terrace",
  ];

  const roomTypes = [
    "Single",
    "Double",
    "Deluxe",
    "Suite",
    "Premium",
    "Executive",
  ];

  const fetchHotel = useCallback(async () => {
    try {
      const data = await adminAPI.getHotel(id);
      setFormData(data.hotel);
    } catch (err) {
      setError("Failed to fetch hotel data");
      console.error("Hotel fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchHotel();
    } else {
      setLoading(false);
    }
  }, [isEdit, fetchHotel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Convert numeric fields to numbers
      const processedFormData = {
        ...formData,
        rooms: formData.rooms.map((room) => ({
          ...room,
          basePrice: Number(room.basePrice),
          maxOccupancy: Number(room.maxOccupancy),
          totalRooms: Number(room.totalRooms),
          availableRooms: Number(room.availableRooms),
        })),
      };

      if (isEdit) {
        await adminAPI.updateHotel(id, processedFormData);
      } else {
        await adminAPI.createHotel(processedFormData);
      }
      navigate("/admin/hotels");
    } catch (err) {
      console.error("Hotel save error:", err);
      console.error("Error response:", err.response?.data);

      // Show detailed validation errors
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const errorMessages = err.response.data.errors
          .map((error) => `${error.field}: ${error.message}`)
          .join("\n");
        setError(`Validation failed:\n${errorMessages}`);
      } else {
        setError(err.response?.data?.message || "Failed to save hotel");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const handlePolicyChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        [field]: value,
      },
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }));
  };

  const handleRoomChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, i) =>
        i === index ? { ...room, [field]: value } : room
      ),
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleRoomAmenityToggle = (roomIndex, amenity) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, i) =>
        i === roomIndex
          ? {
              ...room,
              amenities: room.amenities.includes(amenity)
                ? room.amenities.filter((a) => a !== amenity)
                : [...room.amenities, amenity],
            }
          : room
      ),
    }));
  };

  const addRoom = () => {
    setFormData((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          type: "Single",
          description: "",
          basePrice: "",
          maxOccupancy: 1,
          amenities: [],
          totalRooms: "",
          availableRooms: "",
        },
      ],
    }));
  };

  const removeRoom = (index) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? "Edit Hotel" : "Add New Hotel"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEdit ? "Update hotel information" : "Create a new hotel listing"}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="font-semibold mb-2">Error creating hotel:</div>
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              1
            </span>
            Basic Information
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hotel Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter hotel name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={4}
                placeholder="Describe your hotel, its unique features, and amenities"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Hotel
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => handleChange("featured", e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Mark as featured hotel
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleChange("isActive", e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Hotel is active and bookable
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              2
            </span>
            Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) =>
                  handleLocationChange("address", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter complete address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => handleLocationChange("city", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={formData.location.state}
                onChange={(e) => handleLocationChange("state", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter state"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={formData.location.country}
                onChange={(e) =>
                  handleLocationChange("country", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter country"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                value={formData.location.pincode}
                onChange={(e) =>
                  handleLocationChange("pincode", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter 6-digit pincode"
                pattern="[0-9]{6}"
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              3
            </span>
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => handleContactChange("phone", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter 10-digit phone number"
                pattern="[0-9]{10}"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) => handleContactChange("email", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              4
            </span>
            Hotel Amenities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {amenitiesList.map((amenity) => (
              <div key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor={`amenity-${amenity}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              Room Types
            </h2>
            <button
              type="button"
              onClick={addRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add Room Type
            </button>
          </div>
          <div className="space-y-6">
            {formData.rooms.map((room, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Room Type {index + 1}
                  </h3>
                  {formData.rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(index)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type *
                    </label>
                    <select
                      value={room.type}
                      onChange={(e) =>
                        handleRoomChange(index, "type", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    >
                      {roomTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={room.basePrice}
                      onChange={(e) =>
                        handleRoomChange(index, "basePrice", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Price per night"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Occupancy *
                    </label>
                    <input
                      type="number"
                      value={room.maxOccupancy}
                      onChange={(e) =>
                        handleRoomChange(index, "maxOccupancy", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Max guests"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Rooms *
                    </label>
                    <input
                      type="number"
                      value={room.totalRooms}
                      onChange={(e) =>
                        handleRoomChange(index, "totalRooms", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Total rooms"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Rooms *
                    </label>
                    <input
                      type="number"
                      value={room.availableRooms}
                      onChange={(e) =>
                        handleRoomChange(
                          index,
                          "availableRooms",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Available rooms"
                      min="0"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Description *
                    </label>
                    <textarea
                      value={room.description}
                      onChange={(e) =>
                        handleRoomChange(index, "description", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={3}
                      placeholder="Describe the room features and amenities"
                      required
                    />
                  </div>
                </div>

                {/* Room Amenities */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Room Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      "WiFi",
                      "TV",
                      "AC",
                      "Mini Bar",
                      "Balcony",
                      "Room Service",
                      "Safe",
                      "Wardrobe",
                    ].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`room-${index}-amenity-${amenity}`}
                          checked={room.amenities.includes(amenity)}
                          onChange={() =>
                            handleRoomAmenityToggle(index, amenity)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`room-${index}-amenity-${amenity}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              6
            </span>
            Hotel Policies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Time *
              </label>
              <input
                type="time"
                value={formData.policies.checkIn}
                onChange={(e) => handlePolicyChange("checkIn", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Time *
              </label>
              <input
                type="time"
                value={formData.policies.checkOut}
                onChange={(e) => handlePolicyChange("checkOut", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Policy *
              </label>
              <textarea
                value={formData.policies.cancellation}
                onChange={(e) =>
                  handlePolicyChange("cancellation", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={3}
                placeholder="Describe your cancellation policy"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/admin/hotels")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {submitting
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
              ? "Update Hotel"
              : "Create Hotel"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HotelForm;
