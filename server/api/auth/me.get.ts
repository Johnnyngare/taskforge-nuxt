// server/api/auth/me.get.ts
import { defineEventHandler, createError } from "h3";
import { UserModel } from "~/server/db/models/user";
// No explicit connectDB needed if using Nitro plugin

export default defineEventHandler(async (event) => {
  // This logic assumes server/middleware/auth.ts verifies the JWT
  // and attaches the user's ID and role to the event context.
  const userId = event.context.user?.id;
  const userRole = event.context.user?.role; // Also log the role from context

  console.log("ME.GET ATTEMPT:");
  console.log("  UserID from context:", userId);
  console.log("  UserRole from context:", userRole);

  if (!userId) {
    console.log("  ME.GET Failed: User ID not found in context (Unauthorized).");
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  try {
    const user = await UserModel.findById(userId).select("-password"); // Exclude password from response

    if (!user) {
      console.log(`  ME.GET Failed: User with ID ${userId} not found in DB.`);
      throw createError({ statusCode: 404, message: "User not found" });
    }

    // The .toJSON() transform will handle _id to id, and remove __v
    console.log("  ME.GET Success: User found and returned.");
    return user.toJSON();
  } catch (error: any) {
    console.error("  ME.GET Error during DB lookup:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Server Error fetching user details",
      message: error.message,
    });
  }
});