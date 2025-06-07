import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Port Alberni coordinates
    const lat = 49.2334;
    const lon = -124.8039;

    // Get API key from environment
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

      return NextResponse.json(demoData);
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
        pressure: currentData.main.pressure,
        feelsLike: Math.round(currentData.main.feels_like),
        uvIndex: calculateUVIndex(
          currentData.weather[0].icon,
          new Date().getHours()
        ), // Estimated based on weather and time
        visibility: Math.round((currentData.visibility || 10000) / 1000), // km
        icon: getWeatherIcon(currentData.weather[0].icon),
        sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString(
          "en-CA",
          { hour: "2-digit", minute: "2-digit" }
        ),
        sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString(
          "en-CA",
          { hour: "2-digit", minute: "2-digit" }
        ),
      },
      hourly: processHourlyForecast(forecastData.list),
      forecast: processDailyForecast(forecastData.list),
      lastUpdated: new Date().toISOString(),
      source: "openweathermap",
    };

    return NextResponse.json({
      ...weatherData,
      cached: false,
    });
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
      error:
        error instanceof Error ? error.message : "API temporarily unavailable",
    };

    return NextResponse.json(fallbackData);
  }
}

function calculateUVIndex(weatherIcon: string, hour: number): number {
  // UV Index estimation based on weather conditions and time of day
  let baseUV = 0;

  // Time-based UV (higher during midday)
  if (hour >= 10 && hour <= 14) {
    baseUV = 7; // Peak UV hours
  } else if (hour >= 8 && hour <= 16) {
    baseUV = 5; // Moderate UV hours
  } else if (hour >= 6 && hour <= 18) {
    baseUV = 3; // Lower UV hours
  } else {
    baseUV = 0; // Night time
  }

  // Weather condition modifier
  if (weatherIcon.includes("01")) {
    // Clear sky
    return Math.min(baseUV, 10);
  } else if (weatherIcon.includes("02")) {
    // Few clouds
    return Math.max(Math.round(baseUV * 0.8), 1);
  } else if (weatherIcon.includes("03") || weatherIcon.includes("04")) {
    // Scattered/broken clouds
    return Math.max(Math.round(baseUV * 0.6), 1);
  } else if (
    weatherIcon.includes("09") ||
    weatherIcon.includes("10") ||
    weatherIcon.includes("11")
  ) {
    // Rain/storms
    return Math.max(Math.round(baseUV * 0.3), 1);
  } else if (weatherIcon.includes("13")) {
    // Snow
    return Math.max(Math.round(baseUV * 0.9), 1); // Snow can reflect UV
  } else {
    // Mist/fog
    return Math.max(Math.round(baseUV * 0.4), 1);
  }
}

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

function processHourlyForecast(forecastList: any[]): any[] {
  // Take first 24 hours (8 items * 3 hours each = 24 hours)
  return forecastList.slice(0, 8).map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.getHours(),
      temp: Math.round(item.main.temp),
      condition: item.weather[0].description,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6),
      precipitation: Math.round((item.pop || 0) * 100), // Probability of precipitation
      icon: getWeatherIcon(item.weather[0].icon),
      timestamp: item.dt,
      label: date.toLocaleTimeString("en-CA", { hour: "2-digit" }),
    };
  });
}

function processDailyForecast(forecastList: any[]): any[] {
  // Group by day and get daily highs/lows with hourly details
  const dailyData: { [key: string]: any } = {};

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date,
        temps: [],
        icons: [],
        conditions: [],
        humidity: [],
        precipitation: [],
        hourlyData: [],
      };
    }

    dailyData[dateKey].temps.push(item.main.temp);
    dailyData[dateKey].icons.push(item.weather[0].icon);
    dailyData[dateKey].conditions.push(item.weather[0].description);
    dailyData[dateKey].humidity.push(item.main.humidity);
    dailyData[dateKey].precipitation.push(item.pop || 0);
    dailyData[dateKey].hourlyData.push({
      time: date.getHours(),
      temp: Math.round(item.main.temp),
      condition: item.weather[0].description,
      precipitation: Math.round((item.pop || 0) * 100),
      icon: getWeatherIcon(item.weather[0].icon),
      label: date.toLocaleTimeString("en-CA", { hour: "2-digit" }),
    });
  });

  // Convert to forecast format
  const days = ["Today", "Tomorrow"];
  return Object.values(dailyData)
    .slice(0, 7)
    .map((day: any, index) => ({
      day:
        index < 2
          ? days[index]
          : day.date.toLocaleDateString("en-CA", { weekday: "short" }),
      fullDate: day.date.toLocaleDateString("en-CA", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      icon: getWeatherIcon(day.icons[0]),
      condition: day.conditions[0],
      avgHumidity: Math.round(
        day.humidity.reduce((a: number, b: number) => a + b, 0) /
          day.humidity.length
      ),
      maxPrecipitation: Math.round(Math.max(...day.precipitation) * 100),
      hourlyData: day.hourlyData,
    }));
}
