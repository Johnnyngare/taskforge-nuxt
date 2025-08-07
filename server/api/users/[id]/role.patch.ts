// server/api/users/[id]/role.patch.ts
import { z } from "zod";
import { defineEventHandler, readBody } from "h3";
import { UserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";

// Zod schema to validate the incoming request body
const updateRoleSchema = z.object({
  role: z.enum(Object.values(UserRole) as [string, ...string[]]),
});

export default defineEventHandler(async (event) => {
  // Step 1: Protect this endpoint (this is crucial)
  // This assumes you have a server-side utility or middleware that verifies
  // the user's token and checks their role.
  const currentUserRole = event.context.user?.role;
  if (currentUserRole !== UserRole.Admin) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  // Step 2: Get the target user ID from the URL
  const targetUserId = event.context.params?.id;
  if (!targetUserId) {
    throw createError({ statusCode: 400, message: "User ID is required" });
  }

  // Step 3: Validate the request body
  const body = await readBody(event);
  const validation = updateRoleSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid role provided",
      data: validation.error.format(),
    });
  }

  // Step 4: Update the user in the database
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      targetUserId,
      { role: validation.data.role },
      { new: true } // Return the updated document
    ).select("-password");

    if (!updatedUser) {
      throw createError({ statusCode: 404, message: "Target user not found" });
    }

    return updatedUser.toJSON();
  } catch (error) {
    console.error("Error updating user role:", error);
    throw createError({
      statusCode: 500,
      message: "An error occurred while updating the role.",
    });
  }
});
