// server/api/auth/login.post.ts
import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { z } from "zod";
import bcrypt from "bcrypt";
import { UserModel } from "~/server/db/models/user";
import { signJwt } from "~/server/utils/jwtHelper"; // <-- USE THE HELPER

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validatedData = loginSchema.parse(body);
  const user = await UserModel.findOne({ email: validatedData.email }).select(
    "+password"
  );

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(validatedData.password, user.password))
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  const tokenPayload = { id: user.id, role: user.role };
  const token = signJwt(tokenPayload);

  setCookie(event, "auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return user.toJSON();
});
