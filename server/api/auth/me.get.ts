// server/api/auth/me.get.ts
import { defineEventHandler, createError } from "h3";
import { UserModel } from "~/server/db/models/user";

export default defineEventHandler(async (event) => {
  // The server middleware has already run and attached the user's ID/role if the token was valid.
  const ctxUser = event.context?.user;

  // FIX: Throw 401 explicitly if ctxUser is not available or doesn't have an ID.
  // This prevents crashing with "Cannot read properties of undefined (reading 'id')"
  // and correctly signals "unauthorized" to the client.
  if (!ctxUser?.id) {
    console.warn("me.get: Unauthorized attempt to fetch user details. No user context.");
    throw createError({
      statusCode: 401,
      message: "Unauthorized: No user context from authentication middleware.",
    });
  }

  try {
    const userId = (ctxUser as any).id; // Cast to any or ensure it's IUser type
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      console.warn(`me.get: User with ID ${userId} not found in database.`);
      throw createError({
        statusCode: 404,
        message: "User not found in database",
      });
    }

    // Return the plain user object. .toJSON() is implicitly called by h3 when returning a Mongoose doc.
    return user.toJSON(); // Ensure it's a plain object
  } catch (error: any) {
    // Handle potential database errors or other unexpected issues
    console.error("me.get: Server error fetching user details.", error?.message || error);
    // Re-throw if it's already an h3 error, otherwise create a generic 500
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Server error fetching user details",
      message: error.message,
    });
  }
});