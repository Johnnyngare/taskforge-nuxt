// server/api/auth/register.post.ts
import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";
import { signJwt } from "~/server/utils/jwtHelper"; 

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event); 
  const validatedData = registerSchema.parse(body);

  // --- LOGGING ---
  console.log("\nREGISTRATION POST REQUEST:");
  console.log("  Incoming Name:", validatedData.name);
  console.log("  Incoming Email:", validatedData.email);
  console.log("  Incoming Password (plain):", validatedData.password); 
  // --- END LOGGING ---

  try {
    const existingUser = await UserModel.findOne({ email: validatedData.email });
    if (existingUser) {
      console.log("  Registration Failure: User with this email already exists.");
      throw createError({
        statusCode: 409, 
        statusMessage: "User with this email already exists.",
      });
    }

    const saltRounds = 10; // Ensure consistent salt rounds with your setup
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
    console.log("  Hashed Password generated:", hashedPassword.substring(0, 20) + '...');


    const newUser = await UserModel.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      provider: "local",
      role: UserRole.FieldOfficer, // Assign default role
    });

    console.log("  New User successfully created and saved to DB:", newUser._id);
    console.log("  New User Role:", newUser.role);

    const tokenPayload = { id: newUser.id, role: newUser.role };

    const token = await signJwt(tokenPayload); 

    console.log("  JWT Token Generated for new user (truncated):", token.substring(0, 30) + '...');


    setCookie(event, "auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    console.log("  Auth cookie set for new user.");

    const userResponse = newUser.toJSON();
    delete userResponse.password;
    console.log("  Registration POST Success: Returning sanitized user data.");
    return userResponse;

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("  Registration Validation Error:", error.flatten().fieldErrors);
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error.flatten().fieldErrors,
      });
    }
    console.error("  Registration POST General Error (catch block):", error.message);
    throw error;
  }
});