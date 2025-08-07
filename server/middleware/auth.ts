// server/middleware/auth.ts (Corrected)

// REMOVED: import jwt from "jsonwebtoken";
import { defineEventHandler, getCookie } from "h3";
import { verifyJwt } from "~/server/utils/jwtHelper"; // <-- USE THE HELPER

// This interface is only used on the server
interface JwtPayload {
  id: string;
  role: string;
}

export default defineEventHandler(async (event) => {
  // This middleware runs for every server request.
  const token = getCookie(event, "auth_token");

  // If no token is found, do nothing. The request proceeds as unauthenticated.
  if (!token) {
    return;
  }

  // Use the server-only helper to verify the token.
  // This isolates the 'jsonwebtoken' dependency completely.
  const decoded = verifyJwt(token);

  if (decoded) {
    // If the token is valid, attach the user payload to the event context.
    event.context.user = decoded as JwtPayload;
  }
});
