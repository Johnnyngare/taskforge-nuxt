// C:/Users/HomePC/taskforge-nuxt/server/api/auth/google.get.ts
import { defineEventHandler, sendRedirect, createError } from "h3";
import { URLSearchParams } from 'url'; // Ensure this import is present

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    // CRITICAL FIX: Access public runtimeConfig variables using their camelCase names
    const GOOGLE_CLIENT_ID = config.public.googleClientId; // CORRECTED ACCESS
    const GOOGLE_OAUTH_REDIRECT_URI = config.public.googleOauthRedirectUri; // CORRECTED ACCESS

    // --- Validation ---
    if (!GOOGLE_CLIENT_ID) {
      console.error("Google Client ID is missing from runtime config. Check .env and nuxt.config.ts");
      throw createError({
        statusCode: 500,
        statusMessage: "Authentication setup error: Client ID missing.",
        fatal: true, // Fatal will show a detailed error page in development
      });
    }
    if (!GOOGLE_OAUTH_REDIRECT_URI) {
      console.error("Google OAuth Redirect URI is missing from public runtime config.");
      throw createError({
        statusCode: 500,
        statusMessage: "Authentication setup error: Redirect URI missing.",
        fatal: true,
      });
    }
    // --- End Validation ---

    // Google OAuth 2.0 endpoint for authorization
    const authorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    // Define the scopes you need
    const scopes = [
      "openid",   // Standard OpenID Connect scope
      "email",    // For reading the user's email address
      "profile",  // For reading the user's basic profile information (name, picture)
    ];

    // Build the query parameters for the Google authorization URL
    const queryParams = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
      response_type: "code", // We are requesting an authorization code
      scope: scopes.join(" "), // Space-separated list of scopes
      access_type: "offline", // Request a refresh token (optional, good for long-term access)
      prompt: "consent select_account", // Always show consent screen and account picker
    });

    console.log("Google OAuth Config (Init):", {
      clientId: GOOGLE_CLIENT_ID ? "Present" : "Missing",
      redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
    });
    console.log("Redirecting to Google Auth URL:", `${authorizeUrl}?${queryParams.toString()}`);

    // Redirect the user's browser to Google's authorization URL
    await sendRedirect(event, `${authorizeUrl}?${queryParams.toString()}`);

  } catch (error) {
    console.error("Server Error in /api/auth/google.get.ts:", error);

    // Provide a generic error message to the client, log details internally
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initiate Google OAuth flow. Please try again.`,
      fatal: true, // Keep fatal true for core server errors here
      cause: error, // Include original error for server-side debugging
    });
  }
});