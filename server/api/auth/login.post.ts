// server/api/auth/login.post.ts
import jwt from "jsonwebtoken";
import { z } from "zod"; // For validation

// Define input schema for validation
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = LoginSchema.parse(body); // Validates input

  // 1. Find user in your MongoDB database
  // 2. Compare password with bcrypt
  // ... if valid ...

  const config = useRuntimeConfig(event);
  // --- ADD THIS CHECK FOR BETTER DEBUGGING ---
if (!config.JWT_SECRET) {
  throw createError({
    statusCode: 500,
    message: 'Server Error: JWT Secret is not configured.',
  });
}
// --- END ADDITION ---
  const userPayload = { id: "user_id_from_db", email: "user_email" };

  const token = jwt.sign(userPayload, config.JWT_SECRET, {
    expiresIn: "7d",
  });

  setCookie(event, "auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { message: "Logged in successfully" };
});
