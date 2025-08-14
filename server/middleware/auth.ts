// server/middleware/auth.ts
import { defineEventHandler, getCookie } from "h3";
import { verifyJwt } from "~/server/utils/jwtHelper";
import { UserModel } from "~/server/db/models/user";
import type { UserRole } from "~/types/user";

interface JwtPayload {
  id: string;
  role: UserRole;
}

export default defineEventHandler(async (event) => {
  const url = event.node?.req?.url;

  if (url && (
      url.startsWith('/__nuxt_icon') ||
      url.startsWith('/__nuxt_error') ||
      url.startsWith('/_nuxt/') ||
      url === '/favicon.ico' ||
      url.startsWith('/api/auth/login') ||
      url.startsWith('/api/auth/register')
  )) {
    return;
  }

  if (!event || !event.node || !event.node.req || !event.node.req.headers) {
      console.error("SERVER MIDDLEWARE ERROR: Incomplete event context (missing req/headers). Skipping auth check for URL:", url || 'unknown');
      return;
  }

  console.log("\nSERVER MIDDLEWARE - Processing Request:");
  console.log("  URL:", url);

  const token = getCookie(event, "auth_token");
  event.context.user = null;

  console.log("  Cookie 'auth_token' received (truncated):", token ? token.substring(0, 30) + '...' : "NOT_FOUND_OR_EMPTY");

  if (!token) {
    console.log("  SERVER MIDDLEWARE: No token found. User context remains null.");
    return;
  }

  const decoded: JwtPayload | null = await verifyJwt(token);

  if (decoded && decoded.id && decoded.role) {
    try {
      const userFromDb = await UserModel.findById(decoded.id).select("name email role profilePhoto provider");

      if (userFromDb) {
        event.context.user = userFromDb.toJSON();
        console.log("  SERVER MIDDLEWARE: User context set from DB for:", userFromDb.id, userFromDb.role, "Name:", userFromDb.name);
      } else {
        console.warn(`  SERVER MIDDLEWARE: User ID ${decoded.id} from token not found in DB. Invalidating token.`);
      }
    } catch (dbError: any) {
      console.error("  SERVER MIDDLEWARE: Database error fetching user for token:", dbError.message);
    }
  } else {
    console.log("  SERVER MIDDLEWARE: Invalid/expired token, user context not set.");
  }
});