"use client";

import { useState, useEffect } from "react";
import {
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ArrowRightIcon,
  SignalIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

// Exact types based on actual API response
interface Departure {
  time: string;
  status: "departed" | "boarding" | "scheduled";
  vessel: string;
}

interface NextDeparture {
  time: string;
  vessel: string;
  minutesUntil: number;
  countdown: string;
}

interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  vessels: string[];
  capacity: {
    vehicles: number;
    passengers: number;
  };
  facilities: string[];
  operatedBy: string;
  departures: Departure[];
  nextDeparture?: NextDeparture;
}

interface FerryData {
  routes: Route[];
  selectedRoute: string;
  conditions: string[];
  alerts: string[];
  emergencyContact: string;
  lastUpdated: string;
  weatherImpact: boolean;
  terminal: {
    name: string;
    operatingHours: string;
    currentStatus: string;
  };
}

export default function FerryWidget() {
  const [ferryData, setFerryData] = useState<FerryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "route">(
    "overview"
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  // Helper functions
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "departed":
        return "bg-gray-100 text-gray-600";
      case "boarding":
        return "bg-green-100 text-green-700 animate-pulse";
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "departed":
        return "✅";
      case "boarding":
        return "🟢";
      case "scheduled":
        return "⏰";
      default:
        return "•";
    }
  };

  // Priority for Port Alberni users (mainland routes first)
  const getRoutePriority = (routeId: string) => {
    const priorities: Record<string, number> = {
      nanhsb: 1, // Nanaimo → Horseshoe Bay (closest to PA)
      duktsa: 2, // Duke Point → Tsawwassen
      swbtsa: 3, // Victoria → Tsawwassen (main mainland route)
      swbful: 4, // Victoria → Salt Spring
      swbsgi: 5, // Victoria → Gulf Islands
    };
    return priorities[routeId] || 99;
  };

  useEffect(() => {
    const fetchFerryData = async () => {
      try {
        const response = await fetch("/api/ferry");
        if (!response.ok) throw new Error("Ferry API failed");

        const data: FerryData = await response.json();

        // Sort routes by priority for Port Alberni users
        const sortedRoutes = [...data.routes].sort(
          (a, b) => getRoutePriority(a.id) - getRoutePriority(b.id)
        );

        setFerryData({
          ...data,
          routes: sortedRoutes,
        });

        // Set default route if none selected
        if (!selectedRouteId && sortedRoutes.length > 0) {
          setSelectedRouteId(sortedRoutes[0].id);
        }

        setError(null);
      } catch (err) {
        console.error("Ferry fetch error:", err);
        setError("Unable to load ferry data");
      } finally {
        setLoading(false);
      }
    };

    fetchFerryData();
    // Refresh every 2 minutes for live data
    const interval = setInterval(fetchFerryData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedRouteId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !ferryData || ferryData.routes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <h2 className="text-lg font-bold">BC Ferries</h2>
        </div>
        <p className="text-red-600 text-sm">
          {error || "No ferry data available"}
        </p>
      </div>
    );
  }

  // Find next departures across all routes
  const allNextDepartures = ferryData.routes
    .filter((route) => route.nextDeparture)
    .map((route) => ({
      ...route.nextDeparture!,
      routeName: route.name,
      routeId: route.id,
    }))
    .sort((a, b) => a.minutesUntil - b.minutesUntil);

  const mostUrgentDeparture = allNextDepartures[0];
  const selectedRoute =
    ferryData.routes.find((r) => r.id === selectedRouteId) ||
    ferryData.routes[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <TruckIcon className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">BC Ferries</h2>
              <div className="flex items-center space-x-2 text-blue-100 text-sm">
                <SignalIcon className="h-4 w-4 animate-pulse" />
                <span>Live Data • {ferryData.routes.length} Routes</span>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-blue-100">
            <div className="font-medium">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-xs">{ferryData.terminal.currentStatus}</div>
            <div className="text-xs opacity-75">
              Updated:{" "}
              {new Date(ferryData.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Next Few Departures */}
        {allNextDepartures.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-blue-100 font-medium">
              🚨 Upcoming Departures
            </div>
            {allNextDepartures.slice(0, 3).map((departure, index) => (
              <div
                key={index}
                className="bg-white/15 backdrop-blur rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => {
                  setSelectedRouteId(departure.routeId);
                  setActiveView("route");
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {index === 0 && (
                        <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                          NEXT
                        </span>
                      )}
                      <div className="text-lg font-bold">
                        {formatTime(departure.time)}
                      </div>
                    </div>
                    <div className="text-xs text-blue-200 truncate">
                      {departure.routeName}
                    </div>
                    <div className="text-xs text-blue-300 truncate">
                      {departure.vessel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-200">
                      {departure.countdown}
                    </div>
                    <div className="text-xs text-blue-100">
                      {departure.minutesUntil === 0
                        ? "Boarding!"
                        : "until departure"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveView("overview")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              activeView === "overview"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            All Routes
          </button>
          <button
            onClick={() => setActiveView("route")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              activeView === "route"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Route Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                Priority Routes from Vancouver Island
              </h3>
              <span className="text-xs text-gray-500">
                Sorted for Port Alberni travelers
              </span>
            </div>

            {ferryData.routes.map((route, index) => (
              <div
                key={route.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedRouteId(route.id);
                  setActiveView("route");
                }}
              >
                {/* Priority Badge */}
                {index < 2 && (
                  <div className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded mb-2">
                    #{index + 1} Priority for PA
                  </div>
                )}

                {/* Route Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">
                      {route.name}
                    </h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                      <span>{route.duration}</span>
                      <span>•</span>
                      <span>
                        {route.vessels.length} vessel
                        {route.vessels.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {route.vessels.join(", ")}
                    </div>
                  </div>

                  {/* Next Departures */}
                  <div className="text-right">
                    {route.nextDeparture ? (
                      <>
                        <div className="text-lg font-bold text-blue-600">
                          {formatTime(route.nextDeparture.time)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {route.nextDeparture.countdown}
                        </div>
                        <div className="text-xs text-gray-500">
                          {route.nextDeparture.vessel}
                        </div>

                        {/* Show upcoming departures count */}
                        {route.departures.filter(
                          (d) => d.status === "scheduled"
                        ).length > 1 && (
                          <div className="text-xs text-blue-600 mt-1">
                            +
                            {route.departures.filter(
                              (d) => d.status === "scheduled"
                            ).length - 1}{" "}
                            more today
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No more departures today
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600">Vehicles</div>
                    <div className="font-bold text-gray-900">
                      {route.capacity.vehicles}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600">Passengers</div>
                    <div className="font-bold text-gray-900">
                      {route.capacity.passengers}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <div className="text-xs text-blue-600">Departures</div>
                    <div className="font-bold text-blue-900">
                      {route.departures.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === "route" && selectedRoute && (
          <div className="space-y-6">
            {/* Route Header */}
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                {selectedRoute.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>{selectedRoute.duration}</span>
                <span>•</span>
                <span>{selectedRoute.distance}</span>
                <span>•</span>
                <span className="text-blue-600 font-medium">
                  {selectedRoute.operatedBy}
                </span>
              </div>
            </div>

            {/* Active Vessels */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Active Vessels
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedRoute.vessels.map((vessel, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    🚢 {vessel}
                  </span>
                ))}
              </div>
            </div>

            {/* Today's Departures */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Today's Schedule
              </h4>
              <div className="space-y-2">
                {selectedRoute.departures
                  .sort((a, b) => {
                    // Sort by status priority: boarding > scheduled > departed
                    const statusPriority = {
                      boarding: 0,
                      scheduled: 1,
                      departed: 2,
                    };
                    const aPriority = statusPriority[a.status] || 3;
                    const bPriority = statusPriority[b.status] || 3;

                    if (aPriority !== bPriority) {
                      return aPriority - bPriority;
                    }

                    // Within same status, sort by time
                    return a.time.localeCompare(b.time);
                  })
                  .map((departure, index, array) => {
                    const isNext =
                      selectedRoute.nextDeparture?.time === departure.time;

                    // Show separator before first departed departure
                    const showSeparator =
                      index > 0 &&
                      departure.status === "departed" &&
                      array[index - 1].status !== "departed";

                    return (
                      <div key={index}>
                        {showSeparator && (
                          <div className="flex items-center my-4">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 text-xs text-gray-500 bg-white">
                              Earlier Today
                            </span>
                            <div className="flex-1 border-t border-gray-300"></div>
                          </div>
                        )}
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isNext
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : departure.status === "departed"
                              ? "border-gray-200 bg-gray-50 opacity-60"
                              : departure.status === "boarding"
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">
                              {getStatusIcon(departure.status)}
                            </span>
                            <div>
                              <div className="font-bold text-gray-900">
                                {formatTime(departure.time)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {departure.vessel}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isNext && (
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                NEXT
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                departure.status
                              )}`}
                            >
                              {departure.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Route Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-700">
                  Vehicle Capacity
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {selectedRoute.capacity.vehicles}
                </div>
                <div className="text-xs text-blue-600">
                  {selectedRoute.capacity.passengers} passengers
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-sm font-semibold text-green-700">
                  Travel Time
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {selectedRoute.duration}
                </div>
                <div className="text-xs text-green-600">
                  {selectedRoute.distance}
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Onboard Facilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedRoute.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        {/* Service Conditions */}
        {ferryData.conditions.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {ferryData.conditions.map((condition, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                >
                  ✓ {condition}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <PhoneIcon className="h-3 w-3" />
              <span className="font-medium">{ferryData.emergencyContact}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Live BC Ferries Data</span>
            </div>
          </div>
          <span>Updates every 2 minutes</span>
        </div>
      </div>
    </div>
  );
}
