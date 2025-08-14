// server/api/auth/login.post.ts
import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { z } from "zod";
import bcrypt from "bcrypt";
import { UserModel } from "~/server/db/models/user";
import { signJwt } from "~/server/utils/jwtHelper";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("[API POST /auth/login] Attempting login for:", body.email);

  try {
    const { email, password } = loginSchema.parse(body);

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user || !user.password) {
      console.warn("[API POST /auth/login] Login failed: User not found or no password set for:", email);
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid credentials",
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("[API POST /auth/login] Login failed: Incorrect password for:", email);
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid credentials",
        message: "Invalid email or password.",
      });
    }

    const tokenPayload = { id: user._id.toString(), role: user.role };
    const token = await signJwt(tokenPayload);

    const isProduction = process.env.NODE_ENV === "production";
    setCookie(event, "auth_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    console.log("[API POST /auth/login] Auth token cookie set successfully.");

    const userResponse = user.toJSON();
    delete userResponse.password;

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