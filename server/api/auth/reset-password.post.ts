// C:/Users/HomePC/taskforge-nuxt/server/api/auth/reset-password.post.ts
import { defineEventHandler, readBody, createError } from "h3";
// CRITICAL FIX: Use named import for UserModel
import { UserModel, type IUserModel } from "~/server/db/models/user"; // <--- CORRECTED IMPORT
import { hashPassword } from "~/server/utils/auth"; // You'll need a utility to hash passwords

export default defineEventHandler(async (event) => {
  try {
    const { token, password } = await readBody(event);

    if (!token || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Token and new password are required.",
      });
    }

    // Find the user by the reset token and ensure it's not expired
    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid or expired password reset token. Please request a new link.",
      });
    }

    // Hash the new password and update user
    user.password = await hashPassword(password); // Use the hashPassword utility
    user.passwordResetToken = undefined; // Invalidate the token
    user.passwordResetExpires = undefined; // Clear the expiry
    user.provider = 'local'; // If they reset a password, they now have a local login
    await user.save();

    return {
      statusCode: 200,
      message: "Your password has been successfully reset.",
    };

  } catch (error: any) {
    console.error("Reset password API error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Failed to reset password.",
    });
  }
});