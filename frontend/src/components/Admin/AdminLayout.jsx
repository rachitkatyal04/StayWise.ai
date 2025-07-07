import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/hotels", label: "Hotels", icon: "🏨" },
    { path: "/admin/bookings", label: "Bookings", icon: "📅" },
    { path: "/admin/analytics", label: "Analytics", icon: "📈" },
    { path: "/admin/users", label: "Users", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="w-full">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="ml-4 mr-2">🏢</span>
                StayWise.ai
              </Link>
            </div>
            <div className="flex items-center pr-6">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-150"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="font-medium">{user?.name}</span>
                  <svg
                    className={`h-5 w-5 transition-transform duration-200 ${
                      dropdownOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
                    <Link
                      to="/"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Site
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`mr-3 text-xl ${
                      isActive ? "transform scale-110" : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className={`${isActive ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
