// C:/Users/HomePC/taskforge-nuxt/server/middleware/auth.ts
import { defineEventHandler, getCookie, deleteCookie } from "h3";
import { verifyJwt } from "~/server/utils/jwtHelper";
import { UserModel, type IUserModel } from "~/server/db/models/user"; // Import IUserModel for user type
import type { UserRole } from "~/types/user";

// Re-defining AUTH_CONSTANTS here for consistent cookie name, etc.
// Alternatively, import AUTH_CONSTANTS from "~/server/utils/auth" if you define it there globally.
const AUTH_CONSTANTS = {
  jwt: {
    cookie: {
      name: "auth_token",
      // other properties are not needed in middleware, just the name
    },
  },
};

interface JwtPayload {
  id: string;
  role: UserRole; // Ensure UserRole is the type expected in JWT
}

export default defineEventHandler(async (event) => {
  const url = event.node?.req?.url;

  // Skip certain internal/public routes
  if (url && (
      url.startsWith('/__nuxt_icon') ||
      url.startsWith('/__nuxt_error') ||
      url.startsWith('/_nuxt/') ||
      url === '/favicon.ico' ||
      url.startsWith('/api/auth/login') ||
      url.startsWith('/api/auth/register') ||
      url.startsWith('/api/auth/google')
  )) {
    return;
  }

  if (!event || !event.node || !event.node.req || !event.node.req.headers) {
      console.error("SERVER MIDDLEWARE ERROR: Incomplete event context (missing req/headers). Skipping auth check for URL:", url || 'unknown');
      return;
  }

  const config = useRuntimeConfig(event);
  const JWT_VERIFICATION_SECRET = (config as { private: { jwtSecret: string } }).private.jwtSecret;

  if (!JWT_VERIFICATION_SECRET) {
    console.error("SERVER MIDDLEWARE ERROR: JWT_SECRET is missing from runtime config for verification. Check .env and nuxt.config.ts.");
    return;
  }
  console.log("SERVER MIDDLEWARE: JWT Secret for VERIFICATION (first 10 chars):", JWT_VERIFICATION_SECRET.substring(0, 10) + '...');


  console.log("\nSERVER MIDDLEWARE - Processing Request:");
  console.log("  URL:", url);

  const token = getCookie(event, AUTH_CONSTANTS.jwt.cookie.name); // Use AUTH_CONSTANTS
  event.context.user = null;

  console.log("  Cookie 'auth_token' received (truncated):", token ? token.substring(0, 30) + '...' : "NOT_FOUND_OR_EMPTY");

  if (!token) {
    console.log("  SERVER MIDDLEWARE: No token found. User context remains null.");
    return;
  }

  const decoded: JwtPayload | null = await verifyJwt(token);

  if (decoded && decoded.id) {
    try {
      const userFromDb = await UserModel.findById(decoded.id).select("name email role profilePhoto provider googleId");

      if (userFromDb) {
        event.context.user = userFromDb.toJSON();
        console.log("  SERVER MIDDLEWARE: User context set from DB for:", userFromDb.id, userFromDb.role, "Name:", userFromDb.name);
      } else {
        console.warn(`  SERVER MIDDLEWARE: User ID ${decoded.id} from token not found in DB. Invalidating token.`);
        deleteCookie(event, AUTH_CONSTANTS.jwt.cookie.name);
      }
    } catch (dbError: any) {
      console.error("  SERVER MIDDLEWARE: Database error fetching user for token:", dbError.message);
      deleteCookie(event, AUTH_CONSTANTS.jwt.cookie.name); // Also delete cookie on DB error
    }
  } else {
    console.log("  SERVER MIDDLEWARE: Invalid/expired token or invalid payload, user context not set.");
    deleteCookie(event, AUTH_CONSTANTS.jwt.cookie.name);
  }
});