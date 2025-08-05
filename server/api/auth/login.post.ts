// server/api/auth/login.post.ts
import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { type IUser } from "~/server/db/models/user"; // Import IUser interface
import { connectDB } from "~/server/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody(event);

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid login credentials.",
      data: validation.error.flatten().fieldErrors,
    });
  }

  const { email, password } = validation.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password.",
      });
    }

    if (!user.passwordHash) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password.",
      });
    }

    const config = useRuntimeConfig(event);
    if (!config.JWT_SECRET) {
      throw createError({
        statusCode: 500,
        message: "Server Error: JWT Secret is not configured.",
      });
    }

    // FIX THIS LINE: Explicitly cast the 'user' variable
    const typedUser = user as IUser; // Cast user to IUser type

    const userPayload = {
      id: typedUser._id.toString(), // Now TypeScript knows _id exists and has .toString()
      email: typedUser.email,
      name: typedUser.name,
    };

    const token = jwt.sign(userPayload, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    setCookie(event, "auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      status: "success",
      message: "Logged in successfully.",
      user: userPayload,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Login process error:", error);
    throw createError({
      statusCode: 500,
      message: "An unexpected error occurred during login.",
    });
  }
});