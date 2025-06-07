"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") return "☀️";
    if (theme === "dark") return "🌙";
    return "💻"; // system
  };

  const getLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex items-center space-x-2 px-3 py-2 rounded-lg 
                 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
                 border border-gray-200 dark:border-gray-700
                 hover:bg-white dark:hover:bg-gray-800
                 transition-all duration-200 shadow-sm hover:shadow-md
                 text-gray-700 dark:text-gray-300 cursor-pointer"
      title={`Current theme: ${getLabel()}`}
    >
      <span className="text-lg transition-transform duration-200 group-hover:scale-110">
        {getIcon()}
      </span>
      <span className="text-sm font-medium hidden sm:inline">{getLabel()}</span>

      {/* Subtle indicator for system preference */}
      {theme === "system" && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full 
                        bg-blue-500 dark:bg-blue-400 
                        ring-2 ring-white dark:ring-gray-800"
        ></div>
      )}
    </button>
  );
}
