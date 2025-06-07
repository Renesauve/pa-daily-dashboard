import { neon } from "@netlify/neon";

export const handler = async (event: any) => {
  const sql = neon();

  try {
    if (event.httpMethod === "GET") {
      // Get recent community posts
      const posts = await sql(`
        SELECT id, type, title, content, user_email, created_at, data
        FROM community_posts 
        WHERE is_approved = true 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Track analytics for community widget view
      await sql(
        `
        INSERT INTO analytics (event_type, widget_name, user_location, data)
        VALUES ($1, $2, $3, $4)
      `,
        [
          "widget_view",
          "community",
          "port_alberni",
          JSON.stringify({ posts_count: posts.length }),
        ]
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          posts: posts.map((post) => ({
            ...post,
            author: post.user_email
              ? post.user_email.split("@")[0]
              : "Anonymous",
            time: getTimeAgo(new Date(post.created_at)),
          })),
        }),
      };
    }

    if (event.httpMethod === "POST") {
      const { type, title, content, userEmail } = JSON.parse(
        event.body || "{}"
      );

      // Validate required fields
      if (!type || !title || !content) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ error: "Missing required fields" }),
        };
      }

      // Insert new community post
      const result = await sql(
        `
        INSERT INTO community_posts (type, title, content, user_email, is_approved)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `,
        [type, title, content, userEmail || "anonymous@local.com", true]
      ); // Auto-approve for demo

      // Track analytics for post creation
      await sql(
        `
        INSERT INTO analytics (event_type, widget_name, user_location, data)
        VALUES ($1, $2, $3, $4)
      `,
        [
          "post_created",
          "community",
          "port_alberni",
          JSON.stringify({ post_type: type }),
        ]
      );

      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          postId: result[0].id,
          message: "Post created successfully",
        }),
      };
    }

    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Community API error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}
