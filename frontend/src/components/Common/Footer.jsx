import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-400">🏨 StayWise.ai</h3>
            <p className="text-gray-300">
              Your smart hotel booking companion. Discover amazing hotels across
              India with our AI-powered recommendations.
            </p>
            <div className="flex space-x-4">
              <button
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="Facebook"
              >
                📘
              </button>
              <button
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                🐦
              </button>
              <button
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="Instagram"
              >
                📷
              </button>
              <button
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="LinkedIn"
              >
                💼
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/search-results"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Find Hotels
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Popular Destinations</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/search-results?city=Mumbai"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Mumbai Hotels
                </Link>
              </li>
              <li>
                <Link
                  to="/search-results?city=Delhi"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Delhi Hotels
                </Link>
              </li>
              <li>
                <Link
                  to="/search-results?city=Bangalore"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Bangalore Hotels
                </Link>
              </li>
              <li>
                <Link
                  to="/search-results?city=Goa"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Goa Hotels
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 StayWise.ai. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="text-gray-400 text-sm">Made with ❤️ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
