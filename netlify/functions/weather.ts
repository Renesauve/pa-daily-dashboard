import { neon } from "@netlify/neon";

export const handler = async (event: any) => {
  const sql = neon();

  try {
    // Check if we have cached weather data
    const cachedWeather = await sql(`
      SELECT data FROM api_cache 
      WHERE cache_key = 'weather_port_alberni' 
      AND expires_at > NOW()
      LIMIT 1
    `);

    if (cachedWeather.length > 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...cachedWeather[0].data,
          cached: true,
        }),
      };
    }

    // Mock weather data (in production, fetch from real weather API)
    const weatherData = {
      current: {
        temp: Math.floor(Math.random() * 10) + 8, // 8-18°C
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy"][
          Math.floor(Math.random() * 4)
        ],
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        icon: ["☀️", "⛅", "☁️", "🌧️"][Math.floor(Math.random() * 4)],
      },
      forecast: Array.from({ length: 5 }, (_, i) => ({
        day: ["Today", "Tomorrow", "Wed", "Thu", "Fri"][i],
        high: Math.floor(Math.random() * 8) + 12, // 12-20°C
        low: Math.floor(Math.random() * 8) + 4, // 4-12°C
        icon: ["☀️", "⛅", "☁️", "🌧️"][Math.floor(Math.random() * 4)],
      })),
      lastUpdated: new Date().toISOString(),
    };

    // Cache the weather data for 15 minutes
    await sql(
      `
      INSERT INTO api_cache (cache_key, data, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
      ON CONFLICT (cache_key) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        expires_at = EXCLUDED.expires_at
    `,
      ["weather_port_alberni", JSON.stringify(weatherData)]
    );

    // Track analytics
    await sql(
      `
      INSERT INTO analytics (event_type, widget_name, user_location, data)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "api_call",
        "weather",
        "port_alberni",
        JSON.stringify({ source: "fresh_data" }),
      ]
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...weatherData,
        cached: false,
      }),
    };
  } catch (error) {
    console.error("Weather API error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to fetch weather data",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
