import React from "react";
import { useNavigate } from "react-router-dom";

const HotelCard = ({ hotel, className = "" }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/hotel/${hotel._id}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ⭐
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ⭐
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ⭐
        </span>
      );
    }

    return stars;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer ${className}`}
      onClick={handleViewDetails}
    >
      {/* Hotel Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            hotel.images?.main ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
          }
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {hotel.featured && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
          {hotel.rating?.count || 0} reviews
        </div>
      </div>

      {/* Hotel Details */}
      <div className="p-4">
        {/* Hotel Name and Location */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {hotel.name}
          </h3>
          <p className="text-sm text-gray-600 flex items-center">
            📍 {hotel.location.address}, {hotel.location.city}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {renderStars(hotel.rating?.average || 0)}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            ({hotel.rating?.average?.toFixed(1) || "0.0"})
          </span>
        </div>

        {/* Amenities */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {(hotel.amenities || []).slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
            {(hotel.amenities || []).length > 3 && (
              <span className="text-xs text-gray-500">
                +{(hotel.amenities || []).length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Price and Room Types */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Starting from</p>
              <p className="text-lg font-bold text-blue-600">
                {formatPrice(
                  hotel.minPrice ||
                    (hotel.rooms && hotel.rooms.length > 0
                      ? Math.min(...hotel.rooms.map((room) => room.basePrice))
                      : 2000)
                )}
              </p>
              <p className="text-xs text-gray-500">per night</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {(hotel.rooms || []).length} room type
                {(hotel.rooms || []).length > 1 ? "s" : ""}
              </p>
              <button
                className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
