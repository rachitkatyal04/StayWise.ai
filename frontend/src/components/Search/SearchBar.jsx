import React, { useState, useEffect } from "react";

const SearchBar = ({ onSearch, className = "", initialValues = {} }) => {
  const [destination, setDestination] = useState(initialValues.city || "");
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || "");
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || "");
  const [guests, setGuests] = useState(initialValues.guests || 1);

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues.city) setDestination(initialValues.city);
    if (initialValues.checkIn) setCheckIn(initialValues.checkIn);
    if (initialValues.checkOut) setCheckOut(initialValues.checkOut);
    if (initialValues.guests) setGuests(initialValues.guests);
  }, [
    initialValues.city,
    initialValues.checkIn,
    initialValues.checkOut,
    initialValues.guests,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination || !checkIn || !checkOut) {
      alert("Please fill in all required fields");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("Check-out date must be after check-in date");
      return;
    }

    onSearch({
      destination,
      checkIn,
      checkOut,
      guests,
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return (
    <form
      onSubmit={handleSubmit}
      className={`search-bar bg-white rounded-lg shadow-lg p-6 relative ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => {
              console.log("Destination input changed:", e.target.value);
              setDestination(e.target.value);
            }}
            onFocus={() => console.log("Destination input focused")}
            onInput={(e) =>
              console.log("Destination input event:", e.target.value)
            }
            placeholder="Where are you going?"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{
              backgroundColor: "white",
              color: "#000000",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
            required
            autoComplete="off"
          />
        </div>

        {/* Check-in Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={today}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{
              backgroundColor: "white",
              color: "#000000",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
            required
          />
        </div>

        {/* Check-out Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || tomorrow}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{
              backgroundColor: "white",
              color: "#000000",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
            required
          />
        </div>

        {/* Guests */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{
              backgroundColor: "white",
              color: "#000000",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-6">
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
        >
          🔍 Search Hotels
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
