import { neon } from "@netlify/neon";

export const handler = async (event: any) => {
  const sql = neon();

  try {
    // Check if we have cached weather data (cache for 15 minutes)
    const cachedWeather = await sql(`
      SELECT data FROM api_cache 
      WHERE cache_key = 'weather_port_alberni_live' 
      AND expires_at > NOW()
      LIMIT 1
    `);

    if (cachedWeather.length > 0) {
      // Track analytics for cached response
      await sql(
        `
        INSERT INTO analytics (event_type, widget_name, user_location, data)
        VALUES ($1, $2, $3, $4)
      `,
        [
          "api_call",
          "weather",
          "port_alberni",
          JSON.stringify({ source: "cache" }),
        ]
      );

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

    // Port Alberni coordinates
    const lat = 49.2334;
    const lon = -124.8039;

    // You'll need to get a free API key from openweathermap.org
    const apiKey = process.env.OPENWEATHER_API_KEY || "demo_key";

    if (apiKey === "demo_key") {
      // Return demo data if no API key is set
      const demoData = {
        current: {
          temp: Math.floor(Math.random() * 10) + 8,
          condition: "Demo Mode - Set OPENWEATHER_API_KEY",
          humidity: 65,
          windSpeed: 15,
          icon: "⛅",
        },
        forecast: Array.from({ length: 5 }, (_, i) => ({
          day: ["Today", "Tomorrow", "Wed", "Thu", "Fri"][i],
          high: Math.floor(Math.random() * 8) + 12,
          low: Math.floor(Math.random() * 8) + 4,
          icon: "⛅",
        })),
        lastUpdated: new Date().toISOString(),
        source: "demo",
      };

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(demoData),
      };
    }

    // Fetch current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!currentResponse.ok) {
      const errorData = await currentResponse
        .json()
        .catch(() => ({ message: "Unknown error" }));
      console.error("OpenWeather API Error:", errorData);

      if (currentResponse.status === 401) {
        throw new Error(
          `API Key Error: ${errorData.message}. Please check your OpenWeatherMap API key.`
        );
      }
      throw new Error(
        `Weather API Error: ${errorData.message || "Failed to fetch weather"}`
      );
    }

    const currentData = await currentResponse.json();

    // Fetch 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!forecastResponse.ok) {
      throw new Error("Failed to fetch weather forecast");
    }

    const forecastData = await forecastResponse.json();

    // Process the data
    const weatherData = {
      current: {
        temp: Math.round(currentData.main.temp),
        condition: currentData.weather[0].description,
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        icon: getWeatherIcon(currentData.weather[0].icon),
      },
      forecast: processForecast(forecastData.list),
      lastUpdated: new Date().toISOString(),
      source: "openweathermap",
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
      ["weather_port_alberni_live", JSON.stringify(weatherData)]
    );

    // Track analytics for fresh API call
    await sql(
      `
      INSERT INTO analytics (event_type, widget_name, user_location, data)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "api_call",
        "weather",
        "port_alberni",
        JSON.stringify({ source: "openweathermap" }),
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

    // Fallback to demo data on error
    const fallbackData = {
      current: {
        temp: 12,
        condition: "Data temporarily unavailable",
        humidity: 65,
        windSpeed: 15,
        icon: "⛅",
      },
      forecast: Array.from({ length: 5 }, (_, i) => ({
        day: ["Today", "Tomorrow", "Wed", "Thu", "Fri"][i],
        high: 14,
        low: 8,
        icon: "⛅",
      })),
      lastUpdated: new Date().toISOString(),
      source: "fallback",
      error: "API temporarily unavailable",
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fallbackData),
    };
  }
};

function getWeatherIcon(openWeatherIcon: string): string {
  const iconMap: { [key: string]: string } = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "⛅",
    "02n": "⛅",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️",
  };

  return iconMap[openWeatherIcon] || "⛅";
}

function processForecast(forecastList: any[]): any[] {
  // Group by day and get daily highs/lows
  const dailyData: { [key: string]: any } = {};

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date,
        temps: [],
        icons: [],
      };
    }

    dailyData[dateKey].temps.push(item.main.temp);
    dailyData[dateKey].icons.push(item.weather[0].icon);
  });

  // Convert to forecast format
  const days = ["Today", "Tomorrow", "Wed", "Thu", "Fri"];
  return Object.values(dailyData)
    .slice(0, 5)
    .map((day: any, index) => ({
      day:
        days[index] ||
        day.date.toLocaleDateString("en-CA", { weekday: "short" }),
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      icon: getWeatherIcon(day.icons[0]),
    }));
}
