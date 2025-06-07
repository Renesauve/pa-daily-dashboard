"use client";

import { useState, useEffect } from "react";

export default function CommunityWidget() {
  const [posts, setPosts] = useState([
    {
      type: "lost_found",
      title: "Lost: Black cat near Beaver Creek",
      content: "Missing since yesterday, very friendly",
      author: "Sarah M.",
      time: "2 hours ago",
      urgent: true,
    },
    {
      type: "update",
      title: "Road work on Johnston complete",
      content: "Great job by the crew, much smoother now!",
      author: "Mike R.",
      time: "4 hours ago",
      urgent: false,
    },
    {
      type: "gas_price",
      title: "Gas dropped to $1.41 at Shell",
      content: "Just filled up, confirmed price",
      author: "Local User",
      time: "1 hour ago",
      urgent: false,
    },
  ]);

  useEffect(() => {
    // TODO: Fetch real community posts from database
    // For now using mock data
  }, []);

  const getPostIcon = (type: string) => {
    switch (type) {
      case "lost_found":
        return "🔍";
      case "gas_price":
        return "⛽";
      case "update":
        return "📢";
      case "event":
        return "📅";
      case "help":
        return "🤝";
      default:
        return "💬";
    }
  };

  const getPostColor = (type: string, urgent: boolean) => {
    if (urgent) return "bg-red-50 border-red-200";

    switch (type) {
      case "lost_found":
        return "bg-yellow-50 border-yellow-200";
      case "gas_price":
        return "bg-green-50 border-green-200";
      case "update":
        return "bg-blue-50 border-blue-200";
      case "event":
        return "bg-purple-50 border-purple-200";
      case "help":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Community</h2>
        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
          + Post
        </button>
      </div>

      {/* Community Posts */}
      <div className="space-y-4 mb-6">
        {posts.map((post, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getPostColor(
              post.type,
              post.urgent
            )}`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-lg mt-0.5">{getPostIcon(post.type)}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{post.title}</h4>
                  {post.urgent && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>by {post.author}</span>
                  <span>{post.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Post Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Quick Post</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
            <span>🔍</span>
            <span className="text-sm font-medium text-yellow-700">
              Lost & Found
            </span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <span>⛽</span>
            <span className="text-sm font-medium text-green-700">
              Gas Price
            </span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            <span>📢</span>
            <span className="text-sm font-medium text-blue-700">Update</span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <span>📅</span>
            <span className="text-sm font-medium text-purple-700">Event</span>
          </button>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Community Guidelines:</span> Be
          respectful, verify information, and help keep PA connected! 🏔️
        </div>
      </div>
    </div>
  );
}
