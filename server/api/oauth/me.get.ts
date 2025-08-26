// server/api/oauth/me.get.ts
import { defineEventHandler, createError } from "h3";
import { UserModel } from "~/server/db/models/user";

export default defineEventHandler(async (event) => {
  const ctxUser = event.context?.user;

  if (!ctxUser || !ctxUser.id) {
    console.warn("[API GET /auth/me] Unauthorized attempt to fetch user details. No user context.");
    throw createError({
      statusCode: 401,
      message: "Unauthorized: No user session found.",
    });
  }

  try {
    if (ctxUser.name && ctxUser.email) {
        console.log(`[API GET /auth/me] Returning full user from context for ${ctxUser.id}.`);
        return {
          statusCode: 200,
          message: "User data retrieved successfully from context",
          user: ctxUser,
        };
    }

    console.warn(`[API GET /auth/me] Context user ${ctxUser.id} missing full details. Fetching from DB as fallback.`);
    const user = await UserModel.findById(ctxUser.id).select("-password -__v");

    if (!user) {
      console.warn(`[API GET /auth/me] User with ID ${ctxUser.id} not found in database.`);
      throw createError({
        statusCode: 404,
        message: "User not found in database or user account is inactive.",
      });
    }

    return {
      statusCode: 200,
      message: "User data retrieved successfully from DB.",
      user: user.toJSON(),
    };
  } catch (error: any) {
    console.error("[API GET /auth/me] Server error fetching user details.", error?.message || error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusStatusMessage: error.statusStatusMessage || "Server error fetching user details",
      message: error.message,
    });
  }
});