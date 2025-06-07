"use client";

import { useState, useEffect } from "react";

export default function GasPricesWidget() {
  const [gasData, setGasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGasData = async () => {
      try {
        const response = await fetch("/api/gas-prices");
        if (!response.ok) throw new Error("Failed to fetch gas prices");
        const data = await response.json();
        setGasData(data);
        setError(null);
      } catch (err) {
        setError("Failed to load gas prices");
        console.error("Gas prices fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGasData();
    // Refresh every 6 hours (since data updates weekly)
    const interval = setInterval(fetchGasData, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "📈";
      case "down":
        return "📉";
      default:
        return "➡️";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-red-600";
      case "down":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !gasData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <span className="text-lg">⛽</span>
          <h2 className="text-xl font-bold">Gas Prices</h2>
        </div>
        <p className="text-red-600 text-sm">
          {error || "Gas price information unavailable"}
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Data source: Government of Canada (Updates weekly)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Gas Prices</h2>
        <span className="text-sm text-gray-500">Regular (¢/L)</span>
      </div>

      {/* Data Source Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">📊</span>
          <div>
            <div className="text-sm font-medium text-blue-700">
              {gasData.dataSource} Data
            </div>
            <div className="text-xs text-blue-600">
              Updates {gasData.updateFrequency?.toLowerCase()} • {gasData.note}
            </div>
            {gasData.dataDate && (
              <div className="text-xs text-blue-600">
                Data from: {gasData.dataDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">Cheapest</div>
          <div className="text-2xl font-bold text-green-700">
            {Math.min(...gasData.stations.map((s) => s.price)).toFixed(1)}¢
          </div>
          <div className="text-sm text-green-600">
            {gasData.cheapestStation}
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Average</div>
          <div className="text-2xl font-bold text-blue-700">
            {gasData.averagePrice.toFixed(1)}¢
          </div>
          <div className="text-sm text-blue-600">City-wide</div>
        </div>
      </div>

      {/* Station List */}
      <div className="space-y-3">
        {gasData.stations.map((station, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {station.name}
                </span>
                <span className={getTrendColor(station.trend)}>
                  {getTrendIcon(station.trend)}
                </span>
              </div>
              <div className="text-sm text-gray-600">{station.address}</div>
              <div className="text-xs text-gray-500">{station.updated}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {station.price.toFixed(1)}¢
              </div>
              {station.price ===
                Math.min(...gasData.stations.map((s) => s.price)) && (
                <div className="text-xs text-green-600 font-medium">
                  CHEAPEST
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Price Alert */}
      {gasData.alert && (
        <div
          className={`mt-4 p-3 border rounded-lg ${
            gasData.alert.type === "good"
              ? "bg-green-50 border-green-200"
              : gasData.alert.type === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{gasData.alert.icon}</span>
            <span
              className={`text-sm font-medium ${
                gasData.alert.type === "good"
                  ? "text-green-700"
                  : gasData.alert.type === "warning"
                  ? "text-yellow-700"
                  : "text-blue-700"
              }`}
            >
              {gasData.alert.message}
            </span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-3">
        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Get Directions
        </button>
        <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          Price Alert
        </button>
      </div>
    </div>
  );
}
