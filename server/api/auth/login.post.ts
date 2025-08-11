//server/api/auth/login.post.ts
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

  try {
    const { email, password } = loginSchema.parse(body);

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user || !user.password) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid credentials",
      });
    }

    const tokenPayload = { id: user.id, role: user.role };
    const token = await signJwt(tokenPayload);

    setCookie(event, "auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // CRITICAL FIX: Return a plain JS object to avoid Devalue errors.
    // The .toJSON() method on your Mongoose model is perfect for this.
    // It converts the document to a POJO and applies any transforms (like removing __v).
    const userResponse = user.toJSON();
    delete userResponse.password; // Ensure password is not in the response

    return userResponse;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error.flatten().fieldErrors,
      });
    }
    // Re-throw other errors (like the 401 from above)
    throw error;
  }
});
