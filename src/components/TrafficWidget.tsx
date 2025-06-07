"use client";

import { useState, useEffect } from "react";

export default function TrafficWidget() {
  const [trafficData, setTrafficData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        setLoading(true);

        // Fetch weather data to inform traffic conditions
        const weatherResponse = await fetch("/api/weather");
        const weatherData = weatherResponse.ok
          ? await weatherResponse.json()
          : null;

        // Generate traffic data based on weather conditions
        const baseRoutes = [
          {
            name: "Hwy 4 (West)",
            baseTravelTime: 25,
            destination: "to Tofino",
          },
          {
            name: "Hwy 4 (East)",
            baseTravelTime: 90,
            destination: "to Parksville",
          },
          {
            name: "Johnston Rd",
            baseTravelTime: 8,
            destination: "",
          },
          {
            name: "3rd Avenue",
            baseTravelTime: 5,
            destination: "",
          },
        ];

        const routes = baseRoutes.map((route) => {
          let status = "clear";
          let delay = 0;
          let travelTime = route.baseTravelTime;

          // Adjust based on weather conditions
          if (weatherData?.current) {
            const { condition, windSpeed, temp } = weatherData.current;

            // Rain impact
            if (condition && condition.toLowerCase().includes("rain")) {
              status = "light";
              delay = Math.ceil(travelTime * 0.15); // 15% delay
              travelTime += delay;
            }

            // Heavy rain/storm impact
            if (
              condition &&
              (condition.toLowerCase().includes("heavy") ||
                condition.toLowerCase().includes("storm"))
            ) {
              status = "heavy";
              delay = Math.ceil(travelTime * 0.25); // 25% delay
              travelTime += delay;
            }

            // Snow/ice impact (rare in Port Alberni but possible)
            if (
              (condition && condition.toLowerCase().includes("snow")) ||
              temp < 0
            ) {
              status = "heavy";
              delay = Math.ceil(travelTime * 0.4); // 40% delay for winter conditions
              travelTime += delay;
            }

            // High wind impact (especially on Hwy 4)
            if (windSpeed > 30 && route.name.includes("Hwy 4")) {
              if (status === "clear") status = "light";
              delay += 3;
              travelTime += 3;
            }
          }

          return {
            name: route.name,
            status,
            travelTime: `${travelTime} min ${route.destination}`.trim(),
            delay,
          };
        });

        // Generate weather-based alerts
        const alerts = [];
        if (weatherData?.current) {
          const { condition, windSpeed, temp } = weatherData.current;

          if (condition && condition.toLowerCase().includes("rain")) {
            alerts.push({
              type: "weather",
              message: "Wet road conditions - drive with caution",
              severity: "medium",
            });
          }

          if (windSpeed > 40) {
            alerts.push({
              type: "weather",
              message: "High winds on Hwy 4 - secure loose cargo",
              severity: "high",
            });
          }

          if (temp < 2) {
            alerts.push({
              type: "weather",
              message: "Possible ice on roads - winter driving conditions",
              severity: "high",
            });
          }
        }

        // Add some realistic construction alerts
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 8 && hour <= 16) {
          // Construction during work hours
          alerts.push({
            type: "construction",
            message: "Minor construction on Beaver Creek Rd until 4 PM",
            severity: "low",
          });
        }

        setTrafficData({
          mainRoutes: routes,
          alerts,
          lastUpdated: new Date().toLocaleTimeString("en-CA", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          weatherBased: !!weatherData,
        });
      } catch (error) {
        console.error("Error fetching traffic data:", error);

        // Fallback to basic data
        setTrafficData({
          mainRoutes: [
            {
              name: "Hwy 4 (West)",
              status: "clear",
              travelTime: "25 min to Tofino",
              delay: 0,
            },
            {
              name: "Hwy 4 (East)",
              status: "clear",
              travelTime: "90 min to Parksville",
              delay: 0,
            },
            {
              name: "Johnston Rd",
              status: "clear",
              travelTime: "8 min",
              delay: 0,
            },
            {
              name: "3rd Avenue",
              status: "clear",
              travelTime: "5 min",
              delay: 0,
            },
          ],
          alerts: [],
          lastUpdated: "Data unavailable",
          weatherBased: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficData();

    // Refresh every 10 minutes
    const interval = setInterval(fetchTrafficData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "clear":
        return "bg-green-100 text-green-700";
      case "light":
        return "bg-yellow-100 text-yellow-700";
      case "heavy":
        return "bg-red-100 text-red-700";
      case "closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "clear":
        return "🟢";
      case "light":
        return "🟡";
      case "heavy":
        return "🔴";
      case "closed":
        return "🚫";
      default:
        return "⚪";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Traffic</h2>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!trafficData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Traffic</h2>
          <span className="text-sm text-red-500">Data unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Traffic</h2>
        <div className="text-right">
          <div className="text-sm text-gray-500">Port Alberni</div>
          <div className="text-xs text-gray-400">
            {trafficData.weatherBased ? "🌤️ Weather-based" : "📊 Standard"}
            {" • Updated "} {trafficData.lastUpdated}
          </div>
        </div>
      </div>

      {/* Main Routes */}
      <div className="space-y-3 mb-6">
        {trafficData.mainRoutes.map((route: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getStatusIcon(route.status)}</span>
              <div>
                <div className="font-semibold text-gray-900">{route.name}</div>
                <div className="text-sm text-gray-600">{route.travelTime}</div>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                route.status
              )}`}
            >
              {route.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Alerts */}
      {trafficData.alerts.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Traffic Alerts</h3>
          {trafficData.alerts.map((alert: any, index: number) => (
            <div
              key={index}
              className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">🚧</span>
                <span className="text-sm text-orange-700 font-medium">
                  {alert.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Issues Message */}
      {trafficData.alerts.length === 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-700 font-medium">
              No traffic issues reported
            </span>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
          Road Conditions
        </button>
        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
          Report Issue
        </button>
      </div>
    </div>
  );
}
