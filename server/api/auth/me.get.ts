//server/api/auth/me.get.ts
import { defineEventHandler, createError } from "h3";
import { UserModel } from "~/server/db/models/user";

export default defineEventHandler(async (event) => {
  // The server middleware has already run and attached the user's ID/role if the token was valid.
  const userId = event.context.user?.id;

  if (!userId) {
    // This correctly throws an error if no user was attached to the context.
    throw createError({
      statusCode: 401,
      message: "Unauthorized: No user context",
    });
  }

  try {
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found in database",
      });
    }

    // Return the plain user object. .toJSON() is implicitly called by h3 when returning a Mongoose doc.
    return user;
  } catch (error: any) {
    // Handle potential database errors
    throw createError({
      statusCode: 500,
      message: "Server error fetching user details",
    });
  }
});
