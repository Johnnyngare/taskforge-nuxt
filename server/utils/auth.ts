// C:/Users/HomePC/taskforge-nuxt/server/utils/auth.ts
import { H3Event, setCookie, deleteCookie } from "h3"; // Added deleteCookie for auth middleware
import crypto from "crypto";
import bcrypt from 'bcryptjs';
import { signJwt, verifyJwt } from "~/server/utils/jwtHelper";
import type { IUserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user"; // Ensure UserRole is imported

// --- Constants for JWT and Cookies ---
const AUTH_CONSTANTS = {
  jwt: {
    expiresIn: "7d",
    cookie: {
      name: "auth_token",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  },
  passwordReset: {
    tokenLength: 32, // Length of the reset token in bytes (64 chars hex)
    expiresInMs: 60 * 60 * 1000, // 1 hour in milliseconds
    saltRounds: 10, // For bcrypt hashing
  },
};

/**
 * Creates a JWT and sets the authentication cookie.
 * This function gets the JWT secret internally via jwtHelper.
 * @param event The H3Event object.
 * @param userId The ID of the user.
 * @param userRole The role of the user (CRITICAL: Pass the actual role string).
 */
export async function sendAuthToken(event: H3Event, userId: string, userRole: UserRole) {
  const token = await signJwt(
    { id: userId, role: userRole }, // Explicitly include role
    AUTH_CONSTANTS.jwt.expiresIn
  );

  setCookie(event, AUTH_CONSTANTS.jwt.cookie.name, token, {
    httpOnly: AUTH_CONSTANTS.jwt.cookie.httpOnly,
    secure: AUTH_CONSTANTS.jwt.cookie.secure,
    sameSite: AUTH_CONSTANTS.jwt.cookie.sameSite,
    path: AUTH_CONSTANTS.jwt.cookie.path,
    maxAge: AUTH_CONSTANTS.jwt.cookie.maxAge,
  });
  console.log("Auth cookie set successfully for user ID:", userId);
}


/**
 * Generates a password reset token, saves it to the user document, and sets its expiry.
 * @param user The user Mongoose document.
 * @returns The generated plain-text token.
 */
export async function generatePasswordResetToken(user: IUserModel): Promise<string> {
  const resetToken = crypto.randomBytes(AUTH_CONSTANTS.passwordReset.tokenLength).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + AUTH_CONSTANTS.passwordReset.expiresInMs);
  console.log(`Generated password reset token for user ${user.email}. Expires: ${user.passwordResetExpires}`);
  return resetToken;
}

/**
 * Sends a password reset email to the user. (Placeholder)
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const config = useRuntimeConfig();
  const baseUrlPublic = config.public.baseUrlPublic;
  const resetUrl = `${baseUrlPublic}/reset-password?token=${token}`;
  
  console.log(`Simulating password reset email to: ${email}`);
  console.log(`Password reset link: ${resetUrl}`);
}

/**
 * Hashes a plain-text password using bcrypt.
 * @param password The plain-text password.
 * @returns The hashed password string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(AUTH_CONSTANTS.passwordReset.saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain-text password with a hashed password using bcrypt.
 * @param plainPassword The plain-text password.
 * @param hashedPassword The hashed password.
 * @returns True if they match, false otherwise.
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}