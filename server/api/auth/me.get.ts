// server/api/auth/me.get.ts
import { defineEventHandler, getCookie, createError } from "h3";
import jwt from "jsonwebtoken";
import User from "~/server/db/models/user";
import { connectDB } from "~/server/db";

export default defineEventHandler(async (event) => {
  await connectDB();

  // Get the JWT token from the cookie
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      message: "No authentication token found.",
    });
  }

  try {
    // Verify the JWT token
    const config = useRuntimeConfig(event);
    if (!config.JWT_SECRET) {
      throw createError({
        statusCode: 500,
        message: "Server Error: JWT Secret is not configured.",
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    // Fetch the user from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "User not found.",
      });
    }

    // Return user data (the toJSON method will exclude sensitive fields)
    return user.toJSON();
  } catch (error: any) {
    // Handle JWT errors
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      throw createError({
        statusCode: 401,
        message: "Invalid or expired authentication token.",
      });
    }

    // Re-throw H3 errors
    if (error.statusCode) {
      throw error;
    }

    console.error("Error in /api/auth/me:", error);
    throw createError({
      statusCode: 500,
      message: "An unexpected error occurred while fetching user data.",
    });
  }
});
