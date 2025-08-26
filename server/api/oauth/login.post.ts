// C:/Users/HomePC/taskforge-nuxt/server/api/auth/login.post.ts
import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserModel, type IUserModel } from "~/server/db/models/user"; // Import IUserModel
import { sendAuthToken, hashPassword, comparePassword } from "~/server/utils/auth"; // Import utilities


const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("[API POST /auth/login] Attempting login for:", body.email);

  try {
    const { email, password } = loginSchema.parse(body);

    // CRITICAL: Select +password to fetch the hashed password from DB
    const user = await UserModel.findOne({ email }).select("+password");

    if (!user || !user.password) {
      console.warn("[API POST /auth/login] Login failed: User not found or no password set for:", email);
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid credentials",
        message: "Invalid email or password.",
      });
    }

    // CRITICAL: Use comparePassword from utils/auth.ts
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.warn("[API POST /auth/login] Login failed: Incorrect password for:", email);
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid credentials",
        message: "Invalid email or password.",
      });
    }

    // CRITICAL FIX: Call sendAuthToken with event, user ID, and user role
    await sendAuthToken(event, user._id.toString(), user.role);
    console.log("[API POST /auth/login] Auth token cookie set successfully.");

    const userResponse = user.toJSON();
    delete userResponse.password; // Ensure password is removed from response

    return {
      statusCode: 200,
      message: "Login successful",
      user: userResponse,
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.warn("[API POST /auth/login] Validation failed:", error.flatten().fieldErrors);
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        message: "Invalid input provided.",
        data: error.flatten().fieldErrors,
      });
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || "An unexpected error occurred during login.";
    console.error(`[API POST /auth/login] Server error during login (Status: ${statusCode}):`, message, error);
    throw createError({
      statusCode: statusCode,
      statusMessage: error.statusMessage || "Login failed due to server error",
      message: message,
    });
  }
});