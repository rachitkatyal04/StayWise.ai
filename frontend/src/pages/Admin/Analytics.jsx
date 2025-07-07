import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revenueData, setRevenueData] = useState([]);
  const [hotelPerformance, setHotelPerformance] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchAnalytics = useCallback(async () => {
    try {
      const [revenue, performance] = await Promise.all([
        adminAPI.getRevenueData(period, year),
        adminAPI.getHotelPerformance(),
      ]);
      setRevenueData(revenue.data || []);
      setHotelPerformance(performance.hotels || []);
    } catch (err) {
      setError("Failed to fetch analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [period, year]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (monthNum) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[monthNum - 1];
  };

  const formatPeriodLabel = (data) => {
    if (!data || !data._id) return "";

    if (period === "monthly") {
      return `${getMonthName(data._id.month)} ${data._id.year}`;
    } else if (period === "yearly") {
      return data._id.year.toString();
    } else {
      return `${data._id.day}/${data._id.month}/${data._id.year}`;
    }
  };

  const getTotalRevenue = () => {
    if (!Array.isArray(revenueData)) return 0;
    return revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  };

  const getTotalBookings = () => {
    if (!Array.isArray(revenueData)) return 0;
    return revenueData.reduce((sum, item) => sum + (item.bookings || 0), 0);
  };

  const getAverageBookingValue = () => {
    const totalRevenue = getTotalRevenue();
    const totalBookings = getTotalBookings();
    return totalBookings > 0 ? totalRevenue / totalBookings : 0;
  };

  const getRevenueGrowth = () => {
    if (!Array.isArray(revenueData) || revenueData.length < 2) return 0;
    const current = revenueData[revenueData.length - 1]?.revenue || 0;
    const previous = revenueData[revenueData.length - 2]?.revenue || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  const maxRevenue = Math.max(
    ...(Array.isArray(revenueData)
      ? revenueData.map((d) => d.revenue || 0)
      : [0])
  );
  const maxHotelRevenue = Math.max(
    ...(Array.isArray(hotelPerformance)
      ? hotelPerformance.map((h) => h.totalRevenue || 0)
      : [0])
  );

  return (
    <div className="space-y-8">
      {/* Period Selection */}
      <div className="flex items-center space-x-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border-gray-300"
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        {period !== "yearly" && (
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border-gray-300"
          >
            {[...Array(5)].map((_, i) => {
              const yearValue = new Date().getFullYear() - i;
              return (
                <option key={yearValue} value={yearValue}>
                  {yearValue}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(getTotalRevenue())}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-900">
            {getTotalBookings()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">
            Average Booking Value
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(getAverageBookingValue())}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Revenue Growth</h3>
          <p className="text-2xl font-bold text-gray-900">
            {getRevenueGrowth().toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Data</h2>
        <div className="space-y-4">
          {Array.isArray(revenueData) &&
            revenueData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{formatPeriodLabel(item)}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          maxRevenue > 0
                            ? ((item.revenue || 0) / maxRevenue) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-gray-900 font-medium min-w-[100px] text-right">
                    {formatCurrency(item.revenue || 0)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Hotel Performance */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Hotel Performance
        </h2>
        <div className="space-y-6">
          {Array.isArray(hotelPerformance) &&
            hotelPerformance.map((hotel, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {hotel.hotelName}
                  </h3>
                  <span className="text-gray-600">
                    {formatCurrency(hotel.totalRevenue || 0)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          maxHotelRevenue > 0
                            ? ((hotel.totalRevenue || 0) / maxHotelRevenue) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {hotel.totalBookings} bookings
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Average booking value:{" "}
                  {formatCurrency(hotel.averageBookingValue || 0)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
