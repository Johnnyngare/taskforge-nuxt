// C:/Users/HomePC/taskforge-nuxt/server/api/auth/forgot-password.post.ts
import { defineEventHandler, readBody, createError } from "h3";
import { UserModel, type IUserModel } from "~/server/db/models/user";
// CRITICAL FIX: Import functions from your new server/utils/auth.ts
import { generatePasswordResetToken, sendPasswordResetEmail } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  try {
    const { email } = await readBody(event);

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email is required.",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn(`Forgot password request for unknown email: ${email}`);
      return {
        statusCode: 200,
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // CRITICAL FIX: Use generatePasswordResetToken and then save the user
    const resetToken = await generatePasswordResetToken(user); // Pass user model
    await user.save(); // Save user with new token and expiry

    // CRITICAL FIX: Use sendPasswordResetEmail
    await sendPasswordResetEmail(user.email, resetToken);

    return {
      statusCode: 200,
      message: "If an account with that email exists, a password reset link has been sent.",
    };

  } catch (error: any) {
    console.error("Forgot password API error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Failed to process forgot password request.",
    });
  }
});