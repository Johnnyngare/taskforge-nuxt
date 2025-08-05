// server/api/auth/register.post.ts
import { defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import bcrypt from "bcrypt";
import User from "~/server/db/models/user";
import { connectDB } from "~/server/db";

// Zod schema for registration input
const registerInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody(event);
  console.log("Registering user with body:", body);
  // 1. Validate the request body
  const validation = registerInputSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed.",
      data: validation.error.flatten().fieldErrors,
    });
  }

  // FIX: Destructure from the validated data, not the raw body
  const { name, email, password } = validation.data;

  try {
    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    console.log("Checking for existing user with email:", existingUser);
    if (existingUser) {
      throw createError({
        statusCode: 409, // Conflict
        message: "A user with this email already exists.",
      });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the new user in the database
    const newUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
    });
    console.log("New user created:", newUser);
    // The user's toJSON method (in the Mongoose schema) should exclude the passwordHash
    return {
      status: "success",
      message: "User registered successfully!",
      user: newUser,
    };
  } catch (error: any) {
    // Re-throw H3 errors (like the 409 Conflict)
    if (error.statusCode) {
      throw error;
    }
    // Catch unexpected server errors
    console.error("Server registration error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to register user due to an unexpected server error.",
    });
  }
});
