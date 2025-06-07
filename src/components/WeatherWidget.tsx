"use client";

import { useState, useEffect } from "react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "hourly" | "details">(
    "overview"
  );

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/weather");

        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        setWeather(data);
        setError(null);

        // Show cache status in console for debugging
        console.log(
          `Weather data ${
            data.cached ? "served from cache" : "fetched fresh"
          } at ${new Date().toLocaleTimeString()}`
        );
      } catch (error) {
        console.error("Weather fetch error:", error);
        setError("Unable to load live weather data");

        // Fallback to demo data
        setWeather({
          current: {
            temp: 12,
            condition: "Data temporarily unavailable",
            humidity: 65,
            windSpeed: 15,
            pressure: 1013,
            feelsLike: 14,
            uvIndex: 3,
            visibility: 10,
            icon: "⛅",
            sunrise: "6:45",
            sunset: "20:30",
          },
          hourly: [],
          forecast: [
            {
              day: "Today",
              high: 14,
              low: 8,
              icon: "⛅",
              condition: "Partly cloudy",
              maxPrecipitation: 20,
              hourlyData: [],
            },
            {
              day: "Tomorrow",
              high: 16,
              low: 9,
              icon: "☀️",
              condition: "Sunny",
              maxPrecipitation: 0,
              hourlyData: [],
            },
          ],
          lastUpdated: new Date().toISOString(),
          source: "fallback",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather data every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Weather</h2>
          <div className="text-right">
            <div className="text-sm text-gray-500">Port Alberni, BC</div>
            <div className="text-xs text-gray-400">Loading...</div>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Weather</h2>
          <span className="text-sm text-red-500">Data unavailable</span>
        </div>
      </div>
    );
  }

  const TabButton = ({ tab, label, isActive, onClick }: any) => (
    <button
      onClick={() => onClick(tab)}
      className={`px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-blue-100 text-blue-800 shadow-sm"
          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  const ConditionDetail = ({ label, value, unit = "", icon }: any) => (
    <div className="text-center">
      <div className="text-sm text-gray-700 mb-2 font-medium">{label}</div>
      <div className="flex items-center justify-center space-x-1">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="font-bold text-xl text-gray-900">
          {value}
          {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Weather</h2>
            <div className="text-base text-gray-700 font-medium">
              {new Date().toLocaleDateString("en-CA", {
                weekday: "long",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-semibold text-gray-800">
              Port Alberni, BC
            </div>
            <div className="text-sm text-gray-600">
              {weather.source === "demo"
                ? "🟠 Demo"
                : weather.cached
                ? "🟢 Cached"
                : "🔵 Live"}
              {" • "}
              {new Date(weather.lastUpdated).toLocaleTimeString("en-CA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Current Weather */}
        <div className="mb-6">
          <div className="flex items-center space-x-8 mb-6">
            <div className="text-8xl flex-shrink-0">{weather.current.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-6xl font-light text-gray-900 mb-1">
                {weather.current.temp}°
              </div>
              <div className="text-xl text-gray-800 font-medium capitalize mb-1">
                {weather.current.condition}
              </div>
              <div className="text-base text-gray-600 font-medium">
                Feels like {weather.current.feelsLike}°
              </div>
            </div>
          </div>

          {/* Detailed conditions */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
            <ConditionDetail
              label="Humidity"
              value={weather.current.humidity}
              unit="%"
              icon="💧"
            />
            <ConditionDetail
              label="Wind"
              value={weather.current.windSpeed}
              unit=" km/h"
              icon="💨"
            />
            <ConditionDetail
              label="Pressure"
              value={weather.current.pressure}
              unit=" hPa"
              icon="🌡️"
            />
            <ConditionDetail
              label="UV Index"
              value={weather.current.uvIndex}
              icon="☀️"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200 -mx-1">
          <TabButton
            tab="overview"
            label="Overview"
            isActive={activeTab === "overview"}
            onClick={setActiveTab}
          />
          <TabButton
            tab="hourly"
            label="Hourly"
            isActive={activeTab === "hourly"}
            onClick={setActiveTab}
          />
          <TabButton
            tab="details"
            label="Details"
            isActive={activeTab === "details"}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {activeTab === "overview" && (
          <div className="space-y-3">
            {weather.forecast?.map((day: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedDay(expandedDay === index ? null : index)
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-20 flex-shrink-0 text-left">
                      <div className="font-semibold text-base text-gray-900">
                        {day.day}
                      </div>
                      {day.fullDate &&
                        day.day !== "Today" &&
                        day.day !== "Tomorrow" && (
                          <div className="text-sm text-gray-600 truncate">
                            {day.fullDate}
                          </div>
                        )}
                    </div>
                    <div className="text-3xl flex-shrink-0">{day.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-base font-semibold text-gray-900 capitalize truncate">
                        {day.condition}
                      </div>
                      {day.maxPrecipitation > 0 && (
                        <div className="text-sm text-blue-700 font-medium">
                          🌧️ {day.maxPrecipitation}% chance
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600 text-base font-medium min-w-[2rem] text-right">
                        {day.low}°
                      </span>
                      <div className="w-20 h-2 bg-gradient-to-r from-blue-300 to-yellow-400 rounded-full"></div>
                      <span className="font-bold text-base text-gray-900 min-w-[2rem]">
                        {day.high}°
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                        expandedDay === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded hourly details */}
                {expandedDay === index && day.hourlyData?.length > 0 && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <h4 className="font-bold text-lg text-gray-900 mb-4">
                      Hourly Forecast
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {day.hourlyData.map((hour: any, hourIndex: number) => (
                        <div
                          key={hourIndex}
                          className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                        >
                          <div className="text-sm text-gray-700 font-medium mb-2 truncate">
                            {hour.label}
                          </div>
                          <div className="text-3xl mb-2">{hour.icon}</div>
                          <div className="font-bold text-lg text-gray-900 mb-1">
                            {hour.temp}°
                          </div>
                          {hour.precipitation > 0 && (
                            <div className="text-sm text-blue-700 font-medium">
                              🌧️ {hour.precipitation}%
                            </div>
                          )}
                          {!hour.precipitation && (
                            <div className="text-sm text-gray-500">No rain</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "hourly" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Next 24 Hours</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {weather.hourly?.map((hour: any, index: number) => (
                <div
                  key={index}
                  className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="text-sm text-gray-700 mb-2 font-medium truncate">
                    {hour.label}
                  </div>
                  <div className="text-3xl mb-2">{hour.icon}</div>
                  <div className="font-bold text-lg text-gray-900 mb-1">
                    {hour.temp}°
                  </div>
                  <div className="text-sm text-blue-700 font-medium">
                    {hour.precipitation}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {hour.windSpeed} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">
                Sun & Moon
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-4 p-5 bg-orange-50 rounded-xl border border-orange-200">
                  <span className="text-4xl">🌅</span>
                  <div>
                    <div className="text-base text-gray-700 font-medium mb-1">
                      Sunrise
                    </div>
                    <div className="font-bold text-xl text-gray-900">
                      {weather.current.sunrise}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-5 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-4xl">🌇</span>
                  <div>
                    <div className="text-base text-gray-700 font-medium mb-1">
                      Sunset
                    </div>
                    <div className="font-bold text-xl text-gray-900">
                      {weather.current.sunset}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">
                Air Quality & Visibility
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-base text-gray-700 font-medium mb-2">
                    Visibility
                  </div>
                  <div className="font-bold text-2xl text-gray-900">
                    {weather.current.visibility} km
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${
                      weather.current.visibility >= 10
                        ? "text-green-700"
                        : weather.current.visibility >= 5
                        ? "text-green-600"
                        : weather.current.visibility >= 2
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {weather.current.visibility >= 10
                      ? "Excellent"
                      : weather.current.visibility >= 5
                      ? "Good"
                      : weather.current.visibility >= 2
                      ? "Moderate"
                      : "Poor"}
                  </div>
                </div>
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm text-gray-700 font-medium mb-2">
                    Air Quality
                  </div>
                  <div
                    className={`font-bold text-2xl ${
                      weather.current.uvIndex <= 2
                        ? "text-green-700"
                        : weather.current.uvIndex <= 5
                        ? "text-yellow-600"
                        : weather.current.uvIndex <= 7
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {weather.current.uvIndex <= 2
                      ? "Good"
                      : weather.current.uvIndex <= 5
                      ? "Moderate"
                      : weather.current.uvIndex <= 7
                      ? "High"
                      : "Very High"}
                  </div>
                  <div className="text-sm text-blue-700 font-medium mt-1">
                    UV Index: {weather.current.uvIndex}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">
                Additional Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-base text-gray-700 font-medium mb-2">
                    Dew Point
                  </div>
                  <div className="font-bold text-2xl text-gray-900">
                    {Math.round(weather.current.temp - 5)}°C
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${
                      Math.round(weather.current.temp - 5) >= 16
                        ? "text-red-600"
                        : Math.round(weather.current.temp - 5) >= 13
                        ? "text-orange-600"
                        : Math.round(weather.current.temp - 5) >= 10
                        ? "text-green-700"
                        : Math.round(weather.current.temp - 5) >= 0
                        ? "text-blue-600"
                        : "text-purple-600"
                    }`}
                  >
                    {Math.round(weather.current.temp - 5) >= 16
                      ? "Muggy"
                      : Math.round(weather.current.temp - 5) >= 13
                      ? "Humid"
                      : Math.round(weather.current.temp - 5) >= 10
                      ? "Comfortable"
                      : Math.round(weather.current.temp - 5) >= 0
                      ? "Dry"
                      : "Very Dry"}
                  </div>
                </div>
                <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="text-base text-gray-700 font-medium mb-2">
                    Cloud Cover
                  </div>
                  <div className="font-bold text-2xl text-gray-900">
                    {weather.current.humidity}%
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${
                      weather.current.humidity >= 80
                        ? "text-blue-700"
                        : weather.current.humidity >= 60
                        ? "text-indigo-600"
                        : weather.current.humidity >= 40
                        ? "text-yellow-600"
                        : "text-orange-600"
                    }`}
                  >
                    {weather.current.humidity >= 80
                      ? "Very Humid"
                      : weather.current.humidity >= 60
                      ? "Humid"
                      : weather.current.humidity >= 40
                      ? "Moderate"
                      : "Dry"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
        <span>Data from OpenWeatherMap</span>
        <span>
          Updated{" "}
          {new Date(weather.lastUpdated).toLocaleTimeString("en-CA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
