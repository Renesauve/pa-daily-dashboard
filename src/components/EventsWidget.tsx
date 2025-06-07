"use client";

import { useState, useEffect } from "react";

export default function EventsWidget() {
  const [events, setEvents] = useState([
    {
      title: "Farmers Market",
      date: "Every Saturday",
      time: "9:00 AM - 2:00 PM",
      location: "Gyro Park",
      type: "market",
      featured: true,
    },
    {
      title: "McLean Mill Tour",
      date: "Dec 10",
      time: "10:00 AM",
      location: "McLean Mill",
      type: "tour",
      featured: false,
    },
    {
      title: "Holiday Light Festival",
      date: "Dec 15-31",
      time: "Dusk - 10 PM",
      location: "Downtown",
      type: "festival",
      featured: true,
    },
    {
      title: "Community Potluck",
      date: "Dec 12",
      time: "6:00 PM",
      location: "Community Centre",
      type: "community",
      featured: false,
    },
  ]);

  useEffect(() => {
    // TODO: Fetch real events data
    // For now using mock data
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "market":
        return "🛒";
      case "tour":
        return "🚶";
      case "festival":
        return "🎉";
      case "community":
        return "🤝";
      case "sports":
        return "⚽";
      case "music":
        return "🎵";
      default:
        return "📅";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "market":
        return "bg-green-50 border-green-200";
      case "tour":
        return "bg-blue-50 border-blue-200";
      case "festival":
        return "bg-purple-50 border-purple-200";
      case "community":
        return "bg-orange-50 border-orange-200";
      case "sports":
        return "bg-red-50 border-red-200";
      case "music":
        return "bg-pink-50 border-pink-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Local Events</h2>
        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
          View All
        </button>
      </div>

      {/* Featured Event */}
      {events.filter((e) => e.featured)[0] && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">
              {getEventIcon(events.filter((e) => e.featured)[0].type)}
            </span>
            <span className="text-sm text-blue-600 font-medium">
              FEATURED EVENT
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">
            {events.filter((e) => e.featured)[0].title}
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>📅 {events.filter((e) => e.featured)[0].date}</div>
            <div>⏰ {events.filter((e) => e.featured)[0].time}</div>
            <div>📍 {events.filter((e) => e.featured)[0].location}</div>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">This Week</h3>
        <div className="space-y-3">
          {events
            .filter((e) => !e.featured)
            .map((event, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-0.5">
                    {getEventIcon(event.type)}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {event.title}
                    </h4>
                    <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                      <div>
                        {event.date} • {event.time}
                      </div>
                      <div>📍 {event.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add Event CTA */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            Have an event to share?
          </div>
          <button className="text-blue-600 font-medium text-sm hover:text-blue-700">
            Submit Event →
          </button>
        </div>
      </div>
    </div>
  );
}
