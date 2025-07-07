import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Utility function to validate JWT token format
const isValidJWTFormat = (token) => {
  if (!token || typeof token !== "string") return false;

  // JWT should have 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // Check if each part is base64 encoded (basic check)
  try {
    parts.forEach((part) => {
      if (part.length === 0) throw new Error("Empty part");
      // Try to decode base64 (will throw if invalid)
      atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Cleanup utility to remove invalid tokens
const cleanupInvalidTokens = () => {
  const token = localStorage.getItem("token");
  if (token && !isValidJWTFormat(token)) {
    console.log("🧹 Cleaning up invalid token from localStorage");
    localStorage.removeItem("token");
    return true;
  }
  return false;
};

// Auto-cleanup on module load
cleanupInvalidTokens();

// Export cleanup function for manual use
window.clearInvalidTokens = cleanupInvalidTokens;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Validate token format before sending
      if (isValidJWTFormat(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("Invalid JWT format detected, removing token");
        localStorage.removeItem("token");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token from localStorage for any 401 error
      localStorage.removeItem("token");

      // Check if this is a token-related error
      const isTokenError = error.response?.data?.tokenError;

      if (isTokenError) {
        console.log("Invalid/malformed token detected, redirecting to login");
        // Only redirect if we're not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response;
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response;
  },

  updateProfile: async (userData) => {
    const response = await api.put("/auth/profile", userData);
    return response;
  },

  // User management (for admin)
  getAllUsers: async (params = {}) => {
    const response = await api.get("/auth/users", { params });
    return response;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/auth/users/${userId}/role`, { role });
    return response;
  },
};

// Hotels API
export const hotelsAPI = {
  search: async (searchParams = {}) => {
    const response = await api.get("/hotels/search", { params: searchParams });
    return response;
  },

  getFeatured: async (limit = 8) => {
    const response = await api.get("/hotels/featured", {
      params: { limit },
    });
    return response.hotels || response;
  },

  getById: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response;
  },

  addReview: async (hotelId, reviewData) => {
    const response = await api.post(`/hotels/${hotelId}/reviews`, reviewData);
    return response;
  },

  getRecommendations: async (userId) => {
    const response = await api.get(`/hotels/recommendations/${userId}`);
    return response;
  },
};

// Bookings API
export const bookingsAPI = {
  create: async (bookingData) => {
    try {
      const response = await api.post("/bookings/create", bookingData);
      return response;
    } catch (error) {
      console.error(
        "Error creating booking:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getUserBookings: async () => {
    const response = await api.get("/bookings");
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response;
  },

  cancel: async (id, reason) => {
    const response = await api.put(`/bookings/${id}/cancel`, { reason });
    return response;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/bookings/${id}/status`, { status });
    return response;
  },
};

// AI Recommendations API
export const recommendationsAPI = {
  getPersonalized: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit);
    if (options.location) params.append("location", options.location);
    if (options.priceMin) params.append("priceMin", options.priceMin);
    if (options.priceMax) params.append("priceMax", options.priceMax);
    if (options.excludeBookedHotels !== undefined) {
      params.append("excludeBookedHotels", options.excludeBookedHotels);
    }

    const response = await api.get(
      `/recommendations/personalized?${params.toString()}`
    );
    return response;
  },

  getTrending: async (location = null, limit = 6) => {
    const params = new URLSearchParams();
    if (location) params.append("location", location);
    params.append("limit", limit);

    const response = await api.get(
      `/recommendations/trending?${params.toString()}`
    );
    return response;
  },

  trackInteraction: async (interactionType, data) => {
    const response = await api.post("/recommendations/track", {
      interactionType,
      data,
    });
    return response;
  },

  submitFeedback: async (
    hotelId,
    feedback,
    clicked = false,
    booked = false
  ) => {
    const response = await api.post("/recommendations/feedback", {
      hotelId,
      feedback,
      clicked,
      booked,
    });
    return response;
  },

  getPreferences: async () => {
    const response = await api.get("/recommendations/preferences");
    return response;
  },

  getInsights: async () => {
    const response = await api.get("/recommendations/insights");
    return response;
  },
};

// Admin API
export const adminAPI = {
  // Hotel Management
  getAllHotels: async (params = {}) => {
    const response = await api.get("/admin/hotels", { params });
    return response;
  },

  getHotel: async (id) => {
    const response = await api.get(`/admin/hotels/${id}`);
    return response;
  },

  createHotel: async (hotelData) => {
    const formData = new FormData();
    formData.append("hotelData", JSON.stringify(hotelData));

    const response = await api.post("/admin/hotels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  updateHotel: async (id, hotelData) => {
    const formData = new FormData();
    formData.append("hotelData", JSON.stringify(hotelData));

    const response = await api.put(`/admin/hotels/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  deleteHotel: async (id) => {
    const response = await api.delete(`/admin/hotels/${id}`);
    return response;
  },

  uploadHotelImages: async (hotelId, formData) => {
    const response = await api.post(
      `/admin/hotels/${hotelId}/images`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response;
  },

  // Booking Management
  getAllBookings: async (params = {}) => {
    const response = await api.get("/admin/bookings", { params });
    return response;
  },

  updateBookingStatus: async (id, status, notes) => {
    const response = await api.put(`/admin/bookings/${id}/status`, {
      status,
      notes,
    });
    return response;
  },

  // Dashboard & Analytics
  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard");
    return response;
  },

  getBookingTrends: async (period = "monthly") => {
    const response = await api.get("/admin/dashboard/booking-trends", {
      params: { period },
    });
    return response;
  },

  // Analytics
  getRevenueData: async (
    period = "monthly",
    year = new Date().getFullYear()
  ) => {
    const response = await api.get("/admin/analytics/revenue", {
      params: { period, year },
    });
    return response;
  },

  getHotelPerformance: async (limit = 10) => {
    const response = await api.get("/admin/analytics/hotels", {
      params: { limit },
    });
    return response;
  },

  // User Management
  getAllUsers: async (params = {}) => {
    const response = await api.get("/admin/users", { params });
    return response;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response;
  },
};

// Payment API
export const paymentAPI = {
  createOrder: async (bookingId, amount) => {
    const response = await api.post("/payment/create-order", {
      bookingId,
      amount,
    });
    return response;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post("/payment/verify", paymentData);
    return response;
  },

  getPaymentStatus: async (orderId) => {
    const response = await api.get(`/payment/status/${orderId}`);
    return response;
  },

  refundPayment: async (paymentId, amount, reason) => {
    const response = await api.post("/payment/refund", {
      paymentId,
      amount,
      reason,
    });
    return response;
  },
};

// File Upload API
export const uploadAPI = {
  uploadImage: async (file, type = "hotel") => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);

    const response = await api.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  uploadMultipleImages: async (files, type = "hotel") => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("type", type);

    const response = await api.post("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },
};

export default api;
