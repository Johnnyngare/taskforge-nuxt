// server/api/auth/google/callback.get.ts
import {
  defineEventHandler,
  getQuery,
  createError,
  setCookie,
  sendRedirect,
  H3Event,
} from "h3";
import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import User, { IUser } from "~/server/db/models/user"; // Ensure IUser is imported
import { connectDB } from "~/server/db";

// --- Configuration Constants ---
// Use these for URLs and JWT options not directly tied to runtime config
const AUTH_CONSTANTS = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    // redirectUri is fetched from runtimeConfig.public
  },
  jwt: {
    expiresIn: "7d",
    cookie: {
      name: "auth_token",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      sameSite: "lax" as const, // Type assertion for TypeScript
      path: "/",
    },
  },
};

// --- Runtime Configuration Interface ---
// Matches the structure and casing of your nuxt.config.ts runtimeConfig
interface AppRuntimeConfig {
  MONGODB_URI?: string;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  public: {
    BASE_URL_PUBLIC?: string;
    GOOGLE_OAUTH_REDIRECT_URI?: string;
  };
}

// --- Google User Interface ---
interface GoogleUser {
  sub: string; // Unique ID from Google
  email: string;
  email_verified: boolean; // Indicates if Google has verified the email
  name?: string;
  picture?: string; // URL to profile picture
  given_name?: string;
  family_name?: string;
}

// --- Helper Functions ---

/**
 * Validates required environment variables for Google OAuth.
 * @param config The runtime configuration.
 * @throws {Error} If any required configuration is missing.
 */
function validateAuthEnv(
  config: AppRuntimeConfig
): asserts config is Required<AppRuntimeConfig> {
  if (
    !config.GOOGLE_CLIENT_ID ||
    !config.GOOGLE_CLIENT_SECRET ||
    !config.JWT_SECRET ||
    !config.public.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    throw new Error(
      "Critical OAuth configuration missing. Check .env and nuxt.config.ts."
    );
  }
}

/**
 * Exchanges the Google authorization code for access and ID tokens.
 * @param code The authorization code.
 * @param config The validated runtime configuration.
 * @returns The token response from Google.
 * @throws {H3Error} If the exchange fails.
 */
async function exchangeAuthCode(
  code: string,
  config: Required<AppRuntimeConfig>
) {
  try {
    const response = await axios.post(AUTH_CONSTANTS.google.tokenUrl, {
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: config.public.GOOGLE_OAUTH_REDIRECT_URI, // Use from public runtime config
      grant_type: "authorization_code",
    });
    return response.data;
  } catch (error) {
    console.error(
      "Axios Error during token exchange:",
      (error as AxiosError).response?.data || error
    );
    throw createError({
      statusCode: (error as AxiosError).response?.status || 400,
      statusMessage: "Failed to exchange authorization code with Google.",
      cause: error,
    });
  }
}

/**
 * Fetches user profile information from Google using the access token.
 * @param accessToken The Google access token.
 * @returns The Google user data.
 * @throws {H3Error} If fetching user info fails.
 */
async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  try {
    const response = await axios.get<GoogleUser>(
      AUTH_CONSTANTS.google.userInfoUrl,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Axios Error fetching Google user information:",
      (error as AxiosError).response?.data || error
    );
    throw createError({
      statusCode: (error as AxiosError).response?.status || 400,
      statusMessage: "Failed to fetch user information from Google.",
      cause: error,
    });
  }
}

/**
 * Finds an existing user or creates a new one in the database based on Google profile.
 * Links Google ID to existing email-based accounts if found.
 * @param googleUser The Google user data.
 * @returns The Mongoose User document.
 * @throws {H3Error} If Google email is not provided or unverified.
 */
async function findOrCreateUser(googleUser: GoogleUser) {
  if (!googleUser.email || !googleUser.email_verified) {
    throw createError({
      statusCode: 400,
      statusMessage: "Google profile must provide a verified email address.",
    });
  }

  // Try to find user by googleId or email
  let user = await User.findOne({
    $or: [{ googleId: googleUser.sub }, { email: googleUser.email }],
  });

  if (!user) {
    // No user found, create new one
    user = await User.create({
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split("@")[0], // Fallback name
      profilePhoto: googleUser.picture,
      googleId: googleUser.sub,
    });
    console.log(`Created new user from Google: ${user.email}`);
  } else if (!user.googleId) {
    // User found by email but no googleId, link the account
    user.googleId = googleUser.sub;
    user.profilePhoto = user.profilePhoto || googleUser.picture; // Update photo if not already set
    await user.save();
    console.log(`Linked existing user ${user.email} with Google account.`);
  } else if (user.googleId !== googleUser.sub) {
    // User found by email, has a different googleId. This implies conflicting accounts.
    // This scenario should ideally be handled with explicit user merging or error.
    // For now, we'll treat it as an existing login via Google.
    console.warn(
      `Conflicting GoogleId for user ${user.email}. Existing: ${user.googleId}, New: ${googleUser.sub}`
    );
  }

  return user;
}

/**
 * Generates a JWT and sets it as an HTTP-only cookie.
 * @param event The H3 event object.
 * @param user The authenticated user document.
 * @param jwtSecret The JWT secret from runtime config.
 */
function setAuthCookie(event: H3Event, user: IUser, jwtSecret: string) {
  const token = jwt.sign(
    {
      userId: user._id.toString(), // Convert ObjectId to string for JWT payload
      email: user.email,
      name: user.name,
      provider: user.googleId ? "google" : "local", // Indicate auth provider
    },
    jwtSecret,
    { expiresIn: AUTH_CONSTANTS.jwt.expiresIn }
  );

  setCookie(event, AUTH_CONSTANTS.jwt.cookie.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only set secure in production (HTTPS)
    sameSite: AUTH_CONSTANTS.jwt.cookie.sameSite,
    path: AUTH_CONSTANTS.jwt.cookie.path,
    maxAge: AUTH_CONSTANTS.jwt.cookie.maxAge,
  });
  console.log("Auth cookie set successfully for user:", user.email);
}

// --- Main Event Handler ---
/**
 * Google OAuth callback handler. Processes the authorization code from Google,
 * fetches user info, creates/finds user in DB, sets JWT cookie, and redirects.
 */
export default defineEventHandler(async (event) => {
  try {
    // 1. Ensure database connection is established
    await connectDB();

    // 2. Get runtime configuration and query parameters from Google's redirect
    const config = useRuntimeConfig(event) as AppRuntimeConfig; // Cast to ensure typing
    const query = getQuery(event);
    const code = query.code as string | undefined; // Code can be undefined if error param exists
    const error = query.error as string | undefined;

    // 3. Handle errors returned directly from Google (e.g., user denied access)
    if (error) {
      console.error("Google OAuth callback error response from Google:", error);
      // Redirect to login with a user-friendly error message
      await sendRedirect(
        event,
        `/login?error=oauth_denied&message=${encodeURIComponent(
          "Google authentication denied or failed."
        )}`
      );
      return; // IMPORTANT: Stop execution after redirect
    }

    // 4. Validate core configuration and presence of authorization code
    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing authorization code from Google.",
        fatal: false, // Not a fatal server error
      });
    }
    validateAuthEnv(config); // Validate environment variables early

    // 5. Exchange authorization code for tokens (access_token, id_token)
    const { access_token, id_token } = await exchangeAuthCode(code, config);

    // 6. Fetch user profile information from Google
    const googleUser = await fetchGoogleUser(access_token);

    // 7. Find or create user in MongoDB
    const user = await findOrCreateUser(googleUser);

    // 8. Generate JWT and set it as an HTTP-only cookie
    // JWT_SECRET is guaranteed to be present by validateAuthEnv
    setAuthCookie(event, user, config.JWT_SECRET as string);

    // 9. Redirect the user to the main dashboard after successful login
    await sendRedirect(event, "/dashboard");
  } catch (error) {
    // Generic error handling for unexpected issues during the callback process
    console.error("Full Google OAuth callback processing failed:", error);

    // Redirect to login with a more detailed, but still user-friendly, error message
    let errorMessage = "Google authentication failed. Please try again.";
    if (error instanceof Error) {
      if (
        error.message.includes("Google profile must provide a verified email")
      ) {
        errorMessage = "Google account does not have a verified email address.";
      } else if (
        error.message.includes("Failed to exchange authorization code")
      ) {
        errorMessage = "Google could not verify your login request.";
      } else if (error.message.includes("Failed to fetch user information")) {
        errorMessage = "Could not retrieve your Google profile information.";
      } else if (
        error.message.includes("Critical OAuth configuration missing")
      ) {
        errorMessage = "Server configuration error. Please contact support.";
      }
    } else if (
      typeof error === "object" &&
      error !== null &&
      "statusMessage" in error &&
      typeof error.statusMessage === "string"
    ) {
      // If it's an H3Error with a custom statusMessage
      errorMessage = error.statusMessage;
    }

    await sendRedirect(
      event,
      `/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`
    );
  }
});
