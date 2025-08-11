// server/middleware/auth.ts

import { defineEventHandler, getCookie } from "h3";
import { verifyJwt } from "~/server/utils/jwtHelper"; // Imports server-only helper

export default defineEventHandler(async (event) => {
  const url = event.node?.req?.url;

  // FIX: Skip authentication for known internal Nuxt/Vite paths that don't have full HTTP contexts.
  if (url && (url.startsWith('/__nuxt_icon') || url.startsWith('/__nuxt_error') || url.startsWith('/_nuxt/'))) {
    // console.log(`SERVER MIDDLEWARE: Skipping internal URL: ${url}`); // Uncomment for debugging if needed
    return;
  }
  
  // FIX: CRITICAL GUARD for 'Cannot read properties of undefined (reading 'req')'
  // Ensure event, event.node, event.node.req, and event.node.req.headers are defined before proceeding.
  if (!event || !event.node || !event.node.req || !event.node.req.headers) {
      console.error("SERVER MIDDLEWARE ERROR: Incomplete event context (missing req/headers). Skipping auth check for URL:", url || 'unknown');
      return; 
  }

  // --- LOGGING ---
  console.log("\nSERVER MIDDLEWARE - Processing Request:");
  console.log("  URL:", url); // Use event.node.req.url directly now that it's guarded
  // --- END LOGGING ---

  const token = getCookie(event, "auth_token");

  // --- LOGGING ---
  console.log("  Cookie 'auth_token' received (truncated):", token ? token.substring(0, 30) + '...' : "NOT_FOUND_OR_EMPTY");
  // --- END LOGGING ---

  if (!token) {
    console.log("  SERVER MIDDLEWARE: No token found. Skipping authentication.");
    return;
  }

  const decoded = await verifyJwt(token); // verifyJwt is awaited and returns decoded payload or null

  if (decoded) {
    event.context.user = decoded; // Attach user to context for subsequent server API handlers
    console.log("  SERVER MIDDLEWARE: User context set for:", decoded.id, decoded.role);
  } else {
    console.log("  SERVER MIDDLEWARE: Invalid token, context not set.");
  }
});