"use client";

import { useState, useEffect } from "react";
import WeatherWidget from "@/components/WeatherWidget";
import FerryWidget from "@/components/FerryWidget";
import GasPricesWidget from "@/components/GasPricesWidget";
import TrafficWidget from "@/components/TrafficWidget";
import EventsWidget from "@/components/EventsWidget";
import CommunityWidget from "@/components/CommunityWidget";
import PowerOutagesWidget from "@/components/PowerOutagesWidget";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextFerry, setNextFerry] = useState("Loading...");

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Fetch next ferry info
    const fetchNextFerry = async () => {
      try {
        const response = await fetch("/api/ferry");
        if (response.ok) {
          const data = await response.json();
          const allNextDepartures = data.routes
            ?.map((r: any) => r.nextDeparture)
            .filter(Boolean)
            .sort((a: any, b: any) => a.minutesUntil - b.minutesUntil);

          if (allNextDepartures && allNextDepartures.length > 0) {
            const next = allNextDepartures[0];
            // Convert 24h time to 12h format
            const [hours, minutes] = next.time.split(":");
            const hour24 = parseInt(hours);
            const hour12 =
              hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const ampm = hour24 >= 12 ? "PM" : "AM";
            setNextFerry(`${hour12}:${minutes} ${ampm}`);
          } else {
            setNextFerry("No departures");
          }
        }
      } catch (error) {
        console.error("Error fetching ferry data:", error);
        setNextFerry("Unavailable");
      }
    };

    fetchNextFerry();

    // Refresh ferry data every 5 minutes
    const ferryInterval = setInterval(fetchNextFerry, 5 * 60 * 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(ferryInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-secondary via-background to-surface-tertiary dark:from-surface via-background dark:to-surface-secondary">
      {/* Header */}
      <header className="bg-surface/90 dark:bg-surface/90 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pa-primary to-pa-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                PA
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Port Alberni Daily
                </h1>
                <p className="text-sm text-foreground-secondary">
                  Your local dashboard for everything PA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button className="bg-gradient-to-r from-pa-primary to-pa-primary-dark text-white px-4 py-2 rounded-lg font-medium hover:from-pa-primary-dark hover:to-pa-primary transition-all shadow-sm hover:shadow-md focus-ring">
                Get Premium
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="widget-base p-4">
            <div className="text-sm text-foreground-secondary font-medium">
              Current Time
            </div>
            <div className="text-xl font-bold text-foreground">
              {currentTime.toLocaleTimeString("en-US", {
                timeZone: "America/Vancouver",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="widget-base p-4">
            <div className="text-sm text-foreground-secondary font-medium">
              Next Ferry
            </div>
            <div className="text-xl font-bold text-pa-primary">{nextFerry}</div>
          </div>
          <div className="widget-base p-4">
            <div className="text-sm text-foreground-secondary font-medium">
              Cheapest Gas
            </div>
            <div className="text-xl font-bold text-pa-secondary">$1.42/L</div>
          </div>
          <div className="widget-base p-4">
            <div className="text-sm text-foreground-secondary font-medium">
              Weather
            </div>
            <div className="text-xl font-bold text-pa-accent">12°C ☁️</div>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <WeatherWidget />
            <FerryWidget />
            <GasPricesWidget />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <TrafficWidget />
            <PowerOutagesWidget />
            <EventsWidget />
            <CommunityWidget />
          </div>
        </div>

        {/* Premium CTA */}
        <div className="mt-12 bg-gradient-to-r from-pa-primary via-pa-primary-light to-pa-secondary rounded-2xl p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl font-bold mb-4">
            Get Real-Time Alerts & Premium Features
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Unlock weather alerts, traffic notifications, ferry delays, and
            personalized community updates delivered directly to your phone.
          </p>
          <button className="bg-white text-pa-primary px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg focus-ring">
            Start Free Trial
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                Port Alberni Daily
              </h3>
              <p className="text-foreground-secondary">
                Your one-stop dashboard for everything happening in Port
                Alberni, BC.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">
                Quick Links
              </h4>
              <ul className="space-y-2 text-foreground-secondary">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Weather
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Ferry Schedule
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Gas Prices
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Events
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Contact</h4>
              <p className="text-foreground-secondary">
                Built with ❤️ for Port Alberni
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
