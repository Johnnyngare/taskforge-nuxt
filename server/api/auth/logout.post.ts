// server/api/auth/logout.post.ts
import { defineEventHandler, deleteCookie, createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    deleteCookie(event, "auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });
    console.log("[API POST /auth/logout] Auth token cookie deleted.");

    return {
      statusCode: 200,
      message: "Logged out successfully.",
    };
  } catch (error: any) {
    console.error("[API POST /auth/logout] Server error during logout:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: "An unexpected error occurred during logout.",
    });
  }
});