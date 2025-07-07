import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show main navigation on admin pages
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              🏨 StayWise.ai
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/hotels"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Hotels
            </Link>
            <Link
              to="/smartstay"
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              SmartStay AI
            </Link>
            {user && (
              <Link
                to="/my-bookings"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                My Bookings
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.name}</span>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - you can expand this later */}
      <div className="md:hidden">
        {/* Add mobile menu implementation later */}
      </div>
    </nav>
  );
};

export default Navigation;
