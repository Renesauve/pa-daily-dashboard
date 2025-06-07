import { NextRequest, NextResponse } from "next/server";

// Add type definitions for better TypeScript support
interface DepartureInfo {
  time: string;
  status: string;
  vessel: string;
}

interface NextDepartureInfo {
  time: string;
  vessel: string;
  minutesUntil: number;
  countdown: string;
}

interface RouteInfo {
  id: string;
  name: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  vessels: string[];
  capacity: { vehicles: number; passengers: number };
  facilities: string[];
  operatedBy: string;
  departures: DepartureInfo[];
  nextDeparture: NextDepartureInfo | null;
}

// Cache for real-time ferry data (5 minutes)
let cachedData: any = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Real BC Ferries API endpoints
const BC_FERRIES_API_BASE = "https://bcferriesapi.ca/v2/";

// Terminal code mappings from BC Ferries API
const TERMINAL_MAPPINGS: { [key: string]: { name: string; location: string } } =
  {
    TSA: { name: "Tsawwassen", location: "Vancouver" },
    SWB: { name: "Swartz Bay", location: "Victoria" },
    HSB: { name: "Horseshoe Bay", location: "Vancouver" },
    NAN: { name: "Departure Bay", location: "Nanaimo" },
    DUK: { name: "Duke Point", location: "Nanaimo" },
    LNG: { name: "Langdale", location: "Sunshine Coast" },
    BOW: { name: "Bowen Island", location: "Bowen Island" },
    FUL: { name: "Fulford Harbour", location: "Salt Spring Island" },
    SGI: { name: "Southern Gulf Islands", location: "Gulf Islands" },
  };

// Route priorities for Port Alberni residents (off-island routes first)
const ROUTE_PRIORITY = [
  "NANHSB", // Nanaimo Departure Bay → Horseshoe Bay
  "DUKTSA", // Nanaimo Duke Point → Tsawwassen
  "SWBTSA", // Victoria Swartz Bay → Tsawwassen
];

async function fetchRealFerryData() {
  try {
    console.log("Fetching real BC Ferries data...");

    const response = await fetch(BC_FERRIES_API_BASE, {
      headers: {
        "User-Agent": "PA-Daily-Dashboard/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`BC Ferries API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "BC Ferries API data received:",
      data?.capacityRoutes?.length || 0,
      "routes"
    );

    return processRealFerryData(data.capacityRoutes || []);
  } catch (error) {
    console.error("Error fetching real BC Ferries data:", error);
    // Return fallback data instead of throwing error
    return getFallbackFerryData();
  }
}

function getFallbackFerryData() {
  const now = new Date();

  // Generate realistic upcoming departure times
  const generateDepartures = (
    startHour: number,
    endHour: number,
    interval: number = 60
  ) => {
    const departures: DepartureInfo[] = [];
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinutes;

    for (let hour = startHour; hour <= endHour; hour += interval / 60) {
      const departureHour = Math.floor(hour);
      const departureMinutes = Math.floor((hour - departureHour) * 60);
      const departureTotalMinutes = departureHour * 60 + departureMinutes;

      const departureTime = `${departureHour
        .toString()
        .padStart(2, "0")}:${departureMinutes.toString().padStart(2, "0")}`;

      let status = "scheduled";
      // If departure was more than 30 minutes ago, mark as departed
      if (departureTotalMinutes < currentTotalMinutes - 30) {
        status = "departed";
      }
      // If departure is within 30 minutes (past or future), mark as boarding
      else if (Math.abs(departureTotalMinutes - currentTotalMinutes) <= 30) {
        status = "boarding";
      }
      // Otherwise it's scheduled for the future

      departures.push({
        time: departureTime,
        status,
        vessel: [
          "Spirit of British Columbia",
          "Coastal Celebration",
          "Spirit of Vancouver Island",
        ][Math.floor(Math.random() * 3)],
      });
    }

    return departures;
  };

  // Calculate next departure with proper time handling
  const findNextDeparture = (
    departures: DepartureInfo[]
  ): NextDepartureInfo | null => {
    const upcoming = departures.find((d) => d.status === "scheduled");
    if (!upcoming) return null;

    const [hours, minutes] = upcoming.time.split(":");
    const departureHour = parseInt(hours);
    const departureMinute = parseInt(minutes);

    // Create departure time for today
    const depTimeToday = new Date(now);
    depTimeToday.setHours(departureHour, departureMinute, 0, 0);

    // If departure time has passed today, it's tomorrow
    let depTime = depTimeToday;
    if (depTimeToday.getTime() <= now.getTime()) {
      depTime = new Date(depTimeToday);
      depTime.setDate(depTime.getDate() + 1);
    }

    const minutesUntil = Math.max(
      0,
      Math.floor((depTime.getTime() - now.getTime()) / (1000 * 60))
    );

    return {
      time: upcoming.time,
      vessel: upcoming.vessel,
      minutesUntil,
      countdown:
        minutesUntil > 60
          ? `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
          : `${minutesUntil}m`,
    };
  };

  const fallbackRoutes: RouteInfo[] = [
    {
      id: "nanhsb",
      name: "Departure Bay → Horseshoe Bay",
      from: "Nanaimo (Departure Bay)",
      to: "Vancouver (Horseshoe Bay)",
      duration: "1h 40min",
      distance: "32 nautical miles",
      vessels: ["Queen of Surrey", "Queen of Oak Bay"],
      capacity: { vehicles: 310, passengers: 1200 },
      facilities: ["Food Services", "Wi-Fi", "Deck Access"],
      operatedBy: "BC Ferries",
      departures: generateDepartures(6, 22, 2),
      nextDeparture: null,
    },
    {
      id: "duktsa",
      name: "Duke Point → Tsawwassen",
      from: "Nanaimo (Duke Point)",
      to: "Vancouver (Tsawwassen)",
      duration: "2h 00min",
      distance: "28 nautical miles",
      vessels: ["Spirit of British Columbia", "Spirit of Vancouver Island"],
      capacity: { vehicles: 370, passengers: 1650 },
      facilities: ["Food Services", "Wi-Fi", "Deck Access", "Arcade"],
      operatedBy: "BC Ferries",
      departures: generateDepartures(5, 23, 2.5),
      nextDeparture: null,
    },
    {
      id: "swbtsa",
      name: "Swartz Bay → Tsawwassen",
      from: "Victoria (Swartz Bay)",
      to: "Vancouver (Tsawwassen)",
      duration: "1h 35min",
      distance: "33 nautical miles",
      vessels: ["Spirit of British Columbia", "Coastal Celebration"],
      capacity: { vehicles: 370, passengers: 1650 },
      facilities: ["Food Services", "Wi-Fi", "Deck Access", "Gift Shop"],
      operatedBy: "BC Ferries",
      departures: generateDepartures(7, 21, 1),
      nextDeparture: null,
    },
  ];

  // Add next departure info to each route
  fallbackRoutes.forEach((route) => {
    route.nextDeparture = findNextDeparture(route.departures);
  });

  return {
    routes: fallbackRoutes,
    selectedRoute: fallbackRoutes[0]?.id || "",
    conditions: [
      "Service operating normally",
      "Fallback data - API temporarily unavailable",
    ],
    alerts: [],
    emergencyContact: "1-888-223-3779",
    lastUpdated: new Date().toISOString(),
    weatherImpact: false,
    terminal: {
      name: "Vancouver Island Terminals",
      operatingHours: "Varies by terminal",
      currentStatus: "Operating",
    },
  };
}

function processRealFerryData(apiData: any[]) {
  const processedRoutes: RouteInfo[] = [];
  const now = new Date();

  // Filter for Port Alberni-relevant off-island routes
  const relevantRoutes =
    apiData?.filter((route) => {
      const routeCode = route.routeCode;
      const fromTerminal = route.fromTerminalCode;

      // Off-island routes from Vancouver Island
      const isOffIslandRoute =
        fromTerminal === "NAN" || // Nanaimo Departure Bay
        fromTerminal === "DUK" || // Nanaimo Duke Point
        fromTerminal === "SWB"; // Victoria Swartz Bay

      return isOffIslandRoute;
    }) || [];

  console.log("Total routes from API:", apiData?.length || 0);
  console.log("Relevant off-island routes found:", relevantRoutes.length);
  console.log(
    "Route codes:",
    relevantRoutes.map((r) => r.routeCode)
  );

  // If no relevant routes found, return fallback data
  if (relevantRoutes.length === 0) {
    console.log("No relevant routes found, using fallback data");
    return getFallbackFerryData();
  }

  // Process each route
  relevantRoutes.forEach((route) => {
    const depTerminal = TERMINAL_MAPPINGS[route.fromTerminalCode];
    const arrTerminal = TERMINAL_MAPPINGS[route.toTerminalCode];

    if (!depTerminal || !arrTerminal) {
      console.log(
        "Skipping route due to missing terminal mapping:",
        route.fromTerminalCode,
        "->",
        route.toTerminalCode
      );
      return;
    }

    const departures: DepartureInfo[] =
      route.sailings?.map((sailing: any) => {
        // Convert "7:00 am" to "07:00" format
        let departureTime = sailing.time;
        if (departureTime.includes("am") || departureTime.includes("pm")) {
          const [time, period] = departureTime.split(" ");
          const [hours, minutes] = time.split(":");
          let hour24 = parseInt(hours);

          if (period === "pm" && hour24 !== 12) hour24 += 12;
          if (period === "am" && hour24 === 12) hour24 = 0;

          departureTime = `${hour24.toString().padStart(2, "0")}:${minutes}`;
        }

        // Override BC Ferries API status with our own time-based logic
        const [hours, minutes] = departureTime.split(":");
        const departureHour = parseInt(hours);
        const departureMinute = parseInt(minutes);
        const departureTotalMinutes = departureHour * 60 + departureMinute;
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        let status = "scheduled";
        // If departure was more than 30 minutes ago, mark as departed
        if (departureTotalMinutes < currentTotalMinutes - 30) {
          status = "departed";
        }
        // If departure is within 30 minutes (past or future), mark as boarding
        else if (Math.abs(departureTotalMinutes - currentTotalMinutes) <= 30) {
          status = "boarding";
        }
        // Otherwise it's scheduled for the future

        return {
          time: departureTime,
          status,
          vessel: sailing.vesselName || "BC Ferry",
        };
      }) || [];

    // Calculate next departure with proper time handling
    const upcomingDepartures = departures.filter(
      (d: DepartureInfo) => d.status === "scheduled"
    );
    const nextDeparture = upcomingDepartures[0];

    let nextDepartureInfo: NextDepartureInfo | null = null;
    if (nextDeparture) {
      const [hours, minutes] = nextDeparture.time.split(":");
      const departureHour = parseInt(hours);
      const departureMinute = parseInt(minutes);

      // Create departure time for today
      const depTimeToday = new Date(now);
      depTimeToday.setHours(departureHour, departureMinute, 0, 0);

      // If departure time has passed today, it's tomorrow
      let depTime = depTimeToday;
      if (depTimeToday.getTime() <= now.getTime()) {
        depTime = new Date(depTimeToday);
        depTime.setDate(depTime.getDate() + 1);
      }

      const minutesUntil = Math.max(
        0,
        Math.floor((depTime.getTime() - now.getTime()) / (1000 * 60))
      );

      nextDepartureInfo = {
        time: nextDeparture.time,
        vessel: nextDeparture.vessel,
        minutesUntil,
        countdown:
          minutesUntil > 60
            ? `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
            : `${minutesUntil}m`,
      };
    }

    processedRoutes.push({
      id: route.routeCode.toLowerCase(),
      name: `${depTerminal.name} → ${arrTerminal.name}`,
      from: `${depTerminal.location} (${depTerminal.name})`,
      to: `${arrTerminal.location} (${arrTerminal.name})`,
      duration: route.sailingDuration || "1h 35min",
      distance: "32 nautical miles", // Default
      vessels: [...new Set(departures.map((d: DepartureInfo) => d.vessel))],
      capacity: { vehicles: 370, passengers: 1650 },
      facilities: ["Food Services", "Wi-Fi", "Deck Access"],
      operatedBy: "BC Ferries",
      departures,
      nextDeparture: nextDepartureInfo,
    });
  });

  // Find the most urgent next departure
  const allNextDepartures = processedRoutes
    .map((r) => r.nextDeparture)
    .filter(Boolean)
    .sort((a, b) => (a?.minutesUntil || 0) - (b?.minutesUntil || 0));

  const nextOverallDeparture = allNextDepartures[0];

  return {
    routes: processedRoutes.slice(0, 6), // Limit to 6 most relevant routes
    selectedRoute: processedRoutes[0]?.id || "",
    conditions: ["Service operating normally", "Live data from BC Ferries API"],
    alerts: [],
    emergencyContact: "1-888-223-3779",
    lastUpdated: new Date().toISOString(),
    weatherImpact: false,
    terminal: {
      name: "Vancouver Island Terminals",
      operatingHours: "Varies by terminal",
      currentStatus: "Operating",
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedData && now - lastFetch < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }

    // Fetch real ferry data
    const ferryData = await fetchRealFerryData();

    // Update cache
    cachedData = ferryData;
    lastFetch = now;

    return NextResponse.json(ferryData);
  } catch (error) {
    console.error("Ferry API error:", error);

    // Return error response
    return NextResponse.json(
      {
        error: "Failed to fetch ferry data",
        message: error instanceof Error ? error.message : "Unknown error",
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
