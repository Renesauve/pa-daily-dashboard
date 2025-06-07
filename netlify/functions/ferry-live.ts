import { neon } from "@netlify/neon";

export const handler = async (event: any) => {
  const sql = neon();

  try {
    // Check cache first (cache for 30 minutes since ferry schedules don't change much)
    const cachedFerry = await sql(`
      SELECT data FROM api_cache 
      WHERE cache_key = 'ferry_port_alberni_live' 
      AND expires_at > NOW()
      LIMIT 1
    `);

    if (cachedFerry.length > 0) {
      await sql(
        `
        INSERT INTO analytics (event_type, widget_name, user_location, data)
        VALUES ($1, $2, $3, $4)
      `,
        [
          "api_call",
          "ferry",
          "port_alberni",
          JSON.stringify({ source: "cache" }),
        ]
      );

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cachedFerry[0].data, cached: true }),
      };
    }

    // BC Ferries doesn't have a public API, so we'll create realistic schedules
    // In a real implementation, you might scrape their website or use a third-party service
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Port Alberni to Bamfield route (seasonal - spring to fall)
    const isSeasonalPeriod = now.getMonth() >= 3 && now.getMonth() <= 9; // April to October

    const ferryData = {
      routes: [
        {
          name: "Port Alberni to Bamfield",
          route: "MV Frances Barkley",
          status: isSeasonalPeriod ? "Operating" : "Seasonal - Closed",
          nextDeparture: isSeasonalPeriod
            ? getNextDeparture(now, "bamfield")
            : null,
          schedule: isSeasonalPeriod ? getBamfieldSchedule(today) : [],
          alerts: isSeasonalPeriod
            ? []
            : ["Seasonal service - Resumes in April"],
          type: "passenger",
        },
        {
          name: "Port Alberni to Ucluelet",
          route: "MV Frances Barkley",
          status: isSeasonalPeriod ? "Operating" : "Seasonal - Closed",
          nextDeparture: isSeasonalPeriod
            ? getNextDeparture(now, "ucluelet")
            : null,
          schedule: isSeasonalPeriod ? getUclucletSchedule(today) : [],
          alerts: isSeasonalPeriod
            ? []
            : ["Seasonal service - Resumes in April"],
          type: "passenger",
        },
      ],
      weather_impact: getWeatherImpact(),
      emergency_notice: null,
      lastUpdated: new Date().toISOString(),
      source: "bc_ferries_simulation",
    };

    // Cache for 30 minutes
    await sql(
      `
      INSERT INTO api_cache (cache_key, data, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
      ON CONFLICT (cache_key) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        expires_at = EXCLUDED.expires_at
    `,
      ["ferry_port_alberni_live", JSON.stringify(ferryData)]
    );

    // Track analytics
    await sql(
      `
      INSERT INTO analytics (event_type, widget_name, user_location, data)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "api_call",
        "ferry",
        "port_alberni",
        JSON.stringify({ source: "live_simulation" }),
      ]
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ferryData, cached: false }),
    };
  } catch (error) {
    console.error("Ferry API error:", error);

    const fallbackData = {
      routes: [
        {
          name: "Port Alberni Ferry Services",
          route: "Data temporarily unavailable",
          status: "Check BC Ferries website",
          nextDeparture: null,
          schedule: [],
          alerts: ["Service information temporarily unavailable"],
          type: "passenger",
        },
      ],
      weather_impact: null,
      emergency_notice: "Please check bcferries.com for current schedules",
      lastUpdated: new Date().toISOString(),
      source: "fallback",
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallbackData),
    };
  }
};

function getNextDeparture(now: Date, route: string): string | null {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Bamfield route typically runs Tuesday/Thursday/Saturday
  if (route === "bamfield") {
    const day = now.getDay();
    if (day === 2 || day === 4 || day === 6) {
      // Tue, Thu, Sat
      if (currentHour < 8) {
        return "8:00 AM";
      } else {
        // Next departure is in 2 days
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 2);
        return `${nextDate.toLocaleDateString("en-CA", {
          weekday: "short",
        })} 8:00 AM`;
      }
    }
  }

  // Ucluelet route typically runs different days
  if (route === "ucluelet") {
    const day = now.getDay();
    if (day === 1 || day === 3 || day === 5) {
      // Mon, Wed, Fri
      if (currentHour < 8) {
        return "8:00 AM";
      } else {
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 2);
        return `${nextDate.toLocaleDateString("en-CA", {
          weekday: "short",
        })} 8:00 AM`;
      }
    }
  }

  return "Check schedule";
}

function getBamfieldSchedule(day: number): string[] {
  if (day === 2 || day === 4 || day === 6) {
    // Tue, Thu, Sat
    return ["8:00 AM - Depart Port Alberni", "5:00 PM - Return from Bamfield"];
  }
  return ["No service today"];
}

function getUclucletSchedule(day: number): string[] {
  if (day === 1 || day === 3 || day === 5) {
    // Mon, Wed, Fri
    return ["8:00 AM - Depart Port Alberni", "6:00 PM - Return from Ucluelet"];
  }
  return ["No service today"];
}

function getWeatherImpact(): string | null {
  // Simulate weather impact based on random chance
  const impacts = [
    null,
    "Slight delays possible due to wind",
    "Rough seas - passenger comfort advisory",
    null,
    null,
  ];

  return impacts[Math.floor(Math.random() * impacts.length)];
}
