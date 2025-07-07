import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Check if token is valid format before making API call
        if (token === "null" || token === "undefined" || !token.includes(".")) {
          console.log("Invalid token format detected, clearing token");
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        try {
          const userData = await authAPI.getProfile();
          setUser(userData.user || userData);
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Clear token for any authentication error
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);

      const { token: newToken, user: userData } = response;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);

      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);

      const { token: newToken, user: newUser } = response;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("token", newToken);

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authAPI.updateProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
