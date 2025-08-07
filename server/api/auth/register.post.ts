// server/api/auth/register.post.ts
import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { z } from "zod";
import bcrypt from "bcrypt";
import { UserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";
import { signJwt } from "~/server/utils/jwtHelper"; // <-- USE THE HELPER

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validatedData = registerSchema.parse(body);

  const existingUser = await UserModel.findOne({ email: validatedData.email });
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: "User with this email already exists.",
    });
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 10);
  const newUser = await UserModel.create({
    name: validatedData.name,
    email: validatedData.email,
    password: hashedPassword,
    provider: "local",
    role: UserRole.FieldOfficer,
  });

  const tokenPayload = { id: newUser.id, role: newUser.role };
  const token = signJwt(tokenPayload);

  setCookie(event, "auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return newUser.toJSON();
});
