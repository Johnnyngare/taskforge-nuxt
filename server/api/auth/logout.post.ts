// server/api/auth/logout.post.ts
import { defineEventHandler, deleteCookie, createError } from "h3";
// No need for mongoose, user model, or jwt for a simple logout

export default defineEventHandler(async (event) => {
  try {
    // Delete the authentication cookie
    // The cookie name 'auth_token' must match what you set in login.post.ts
    deleteCookie(event, "auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // Ensure path matches where it was set
    });

    // Return a success message
    return {
      status: "success",
      message: "Logged out successfully.",
    };
  } catch (error: any) {
    // Log unexpected errors, but generally, logout should always succeed client-side.
    console.error("Error during server logout:", error);
    throw createError({
      statusCode: 500,
      message: "An unexpected error occurred during logout.",
    });
  }
});