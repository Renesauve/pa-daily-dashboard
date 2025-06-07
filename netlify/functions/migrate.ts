import { neon } from "@netlify/neon";

export const handler = async () => {
  const sql = neon();

  try {
    // Create users table for premium subscriptions
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        subscription_date TIMESTAMP,
        notification_preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create analytics table
    await sql(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        widget_name VARCHAR(100),
        user_location VARCHAR(100),
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cache table for API responses
    await sql(`
      CREATE TABLE IF NOT EXISTS api_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create community posts table
    await sql(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- 'gas_price', 'lost_found', 'event', 'update'
        title VARCHAR(255) NOT NULL,
        content TEXT,
        data JSONB DEFAULT '{}',
        is_approved BOOLEAN DEFAULT FALSE,
        user_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user preferences table
    await sql(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        widget_layout JSONB DEFAULT '{}',
        favorite_locations JSONB DEFAULT '[]',
        home_location JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Database migration completed successfully",
      }),
    };
  } catch (error) {
    console.error("Migration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Migration failed" }),
    };
  }
};
