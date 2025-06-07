export const handler = async (event: any) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  console.log("API Key status:", apiKey ? "Found" : "Missing");
  console.log("API Key length:", apiKey?.length || 0);
  console.log("API Key first 8 chars:", apiKey?.substring(0, 8) || "N/A");

  if (!apiKey) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "No API key found",
        message: "OPENWEATHER_API_KEY environment variable is not set",
      }),
    };
  }

  try {
    // Test the API key with a simple call
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=49.2334&lon=-124.8039&appid=${apiKey}&units=metric`
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        apiKeyLength: apiKey.length,
        response: response.ok
          ? {
              city: data.name,
              temp: data.main?.temp,
              condition: data.weather?.[0]?.description,
            }
          : data,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
