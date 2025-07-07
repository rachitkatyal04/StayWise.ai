import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import HotelsPage from "./pages/HotelsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import SmartStayPage from "./pages/SmartStayPage";

// Admin components
import AdminRoute from "./components/Admin/AdminRoute";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import HotelManagement from "./pages/Admin/HotelManagement";
import HotelForm from "./pages/Admin/HotelForm";
import BookingManagement from "./pages/Admin/BookingManagement";
import Analytics from "./pages/Admin/Analytics";
import UserManagement from "./pages/Admin/UserManagement";
import AIChatbot from "./components/Chatbot/AIChatbot";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search-results" element={<SearchResultsPage />} />
            <Route path="/hotel/:id" element={<HotelDetailsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />
            <Route
              path="/booking-confirmation"
              element={<BookingConfirmationPage />}
            />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/smartstay" element={<SmartStayPage />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/hotels"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <HotelManagement />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/hotels/new"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <HotelForm />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/hotels/:id/edit"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <HotelForm />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <BookingManagement />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Analytics />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <UserManagement />
                  </AdminLayout>
                </AdminRoute>
              }
            />
          </Routes>

          {/* AI Chatbot - appears on all pages */}
          <AIChatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
