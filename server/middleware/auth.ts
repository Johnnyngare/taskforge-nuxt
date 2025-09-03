// C:/Users/HomePC/taskforge-nuxt/server/middleware/auth.ts
import { defineEventHandler, getCookie, deleteCookie } from "h3";
import { verifyJwt } from "~/server/utils/jwtHelper";
import { UserModel, type IUserModel } from "~/server/db/models/user";
import type { UserRole } from "~/types/user";

const AUTH_CONSTANTS = {
  jwt: {
    cookie: {
      name: "auth_token",
    },
  },
};

interface JwtPayload {
  id: string;
  role: UserRole;
}

export default defineEventHandler(async (event) => {
  const url = event.node?.req?.url;

  // Skip auth for public/internal routes
  if (
    url &&
    (
      url.startsWith("/__nuxt_icon") ||
      url.startsWith("/__nuxt_error") ||
      url.startsWith("/_nuxt/") ||
      url === "/favicon.ico" ||
      url.startsWith("/api/oauth/login") ||
      url.startsWith("/api/oauth/register") ||
      url.startsWith("/api/oauth/google")
    )
  ) {
    return;
  }

  if (!event?.node?.req?.headers) {
    console.error("AUTH MIDDLEWARE ERROR: Incomplete event context (missing req/headers). Skipping auth for URL:", url || "unknown");
    return;
  }

  // Load runtime config
  const config = useRuntimeConfig(event);

  // Now jwtSecret comes from runtimeConfig.private
  const JWT_VERIFICATION_SECRET = config?.private?.jwtSecret;
  if (!JWT_VERIFICATION_SECRET) {
    console.error("AUTH MIDDLEWARE ERROR: jwtSecret is missing in runtime config. Check your .env and nuxt.config.ts");
    return;
  }

  console.log("AUTH MIDDLEWARE: Using JWT secret (first 10 chars):", JWT_VERIFICATION_SECRET.substring(0, 10) + "...");

  // Read JWT token from cookie
  const token = getCookie(event, AUTH_CONSTANTS.jwt.cookie.name);
  event.context.user = null;

  console.log("AUTH MIDDLEWARE: Cookie 'auth_token':", token ? token.substring(0, 30) + "..." : "NOT_FOUND");

  if (!token) {
    console.log("AUTH MIDDLEWARE: No token found → user context stays null.");
    return;
  }

  // Verify JWT
  const decoded: JwtPayload | null = await verifyJwt(token);

  if (decoded?.id) {
    try {
      const userFromDb = await UserModel.findById(decoded.id).select("name email role profilePhoto provider googleId");

      if (userFromDb) {
        event.context.user = userFromDb.toJSON();
        console.log(`AUTH MIDDLEWARE: User authenticated → ID: ${userFromDb.id}, Role: ${userFromDb.role}, Name: ${userFromDb.name}`);
      } else {
        console.warn(`AUTH MIDDLEWARE: Token user ID ${decoded.id} not found → deleting cookie.`);
        deleteCookie(event, AUTH_CONSTANTS.jwt.cookie.name);
      }
    } catch (err: any) {
      console.error("AUTH MIDDLEWARE: DB error fetching user:", err.message);
      deleteCookie(event, AUTH_CONSTANTS.jwt.cookie.name);
    }
  } else {
    console.log("AUTH MIDDLEWARE: Invalid or expired token → deleting cookie.");
    deleteCookie(event, AUTH_CONSTANTS.jwt.cookie.name);
  }
});
