// taskforge-nuxt/server/api/auth/register.post.ts
import { defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import bcrypt from "bcrypt";
import User from "~/server/db/models/user";
import { connectDB } from "~/server/db";

// Updated Zod schema with passthrough() to allow extra fields
const registerInputSchema = z
  .object({
    name: z.string().min(2, "Name is required").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    // If you plan to store acceptMarketing, it should be defined here
    acceptMarketing: z.boolean().optional(),
    // acceptTerms is typically frontend validation only, but if you want to pass it through:
    // acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms of service").optional(),
  })
  .passthrough(); // This allows extra fields like acceptMarketing, and acceptTerms to be sent without schema error

export default defineEventHandler(async (event) => {
  await connectDB();

  let validatedData; // Declare validatedData here
  try {
    const rawBody = await readBody(event); // Read the raw request body
    console.log("Backend received raw body for registration:", rawBody); // Keep for debugging

    // Validate and parse the raw body into validatedData
    validatedData = registerInputSchema.parse(rawBody);
  } catch (validationError) {
    console.error("Server-side Zod validation error:", validationError);

    if (validationError instanceof z.ZodError) {
      const fieldErrors = validationError.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; "); // Use semicolon for readability if multiple errors

      throw createError({
        statusCode: 400,
        message: `Validation failed: ${fieldErrors}`,
        data: validationError.errors, // Provide detailed errors to the client
      });
    }

    // Handle non-Zod validation errors from readBody or other parsing issues
    throw createError({
      statusCode: 400,
      message: "Invalid request body format.",
      cause: validationError, // Include cause for server-side debugging
    });
  }

  // --- CORRECTED: Destructure from 'validatedData', NOT 'body' ---
  const { name, email, password, acceptMarketing } = validatedData;
  // --- END CORRECTED ---

  // Removed explicit checks for !name || !email || !password
  // Because Zod's schema (name: z.string().min(2), email: z.string().email(), password: z.string().min(8))
  // already ensures these are non-empty and valid strings.
  // If `validatedData` contains them, they are guaranteed to be valid strings.

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError({
        statusCode: 409, // Conflict status code
        message: "A user with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      // Only include acceptMarketing if your Mongoose User model has it defined.
      // If it doesn't, do NOT include it here, as Mongoose might throw an error.
      // Assume your User model has 'acceptMarketing: Boolean' if you include it.
      acceptMarketing: acceptMarketing || false, // Default to false if optional and not provided
    });

    return {
      status: "success",
      message: "User registered successfully!",
      user: newUser, // newUser will have passwordHash excluded by your schema's toJSON
    };
  } catch (error) {
    console.error("Server registration error:", error);

    // Re-throw if it's already an H3Error (e.g., 409 Conflict from existing user check)
    if (error.statusCode) {
      throw error;
    }

    // Generic error for unexpected server-side issues
    throw createError({
      statusCode: 500,
      message: "Failed to register user due to an unexpected server error.",
      cause: error, // Include original error for debugging
    });
  }
});
