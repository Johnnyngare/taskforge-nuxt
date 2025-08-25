// C:/Users/HomePC/taskforge-nuxt/server/api/auth/google/callback.get.ts
import {
  defineEventHandler,
  getQuery,
  createError,
  // REMOVED: setCookie, // No longer needed here as sendAuthToken handles it
  sendRedirect,
  H3Event,
} from "h3";
import axios, { AxiosError } from "axios";
// REMOVED: import jwt from "jsonwebtoken"; // No longer needed here
import { UserModel, type IUserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";
// CRITICAL FIX: Import sendAuthToken from your new server/utils/auth.ts
import { sendAuthToken } from "~/server/utils/auth";


const AUTH_CONSTANTS = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  jwt: {
    expiresIn: "7d",
    cookie: {
      name: "auth_token",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax" as const,
      path: "/",
    },
  },
};

interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

interface ServerRuntimeConfig {
  public: {
    googleClientId?: string;
    googleOauthRedirectUri?: string;
  };
  private: {
    jwtSecret?: string;
    googleClientSecret?: string;
  };
}

function validateAuthEnv(
  config: ServerRuntimeConfig
): asserts config is Required<ServerRuntimeConfig> {
  const missingConfig: string[] = [];

  if (!config.public.googleClientId) missingConfig.push("GOOGLE_CLIENT_ID (public)");
  if (!config.public.googleOauthRedirectUri) missingConfig.push("GOOGLE_OAUTH_REDIRECT_URI (public)");

  if (!config.private.googleClientSecret) missingConfig.push("GOOGLE_CLIENT_SECRET (private)");
  if (!config.private.jwtSecret) missingConfig.push("JWT_SECRET (private)");

  if (missingConfig.length > 0) {
    console.error("Critical OAuth configuration missing. Check .env and nuxt.config.ts:", missingConfig.join(", "));
    throw new Error(
      `Critical OAuth configuration missing: ${missingConfig.join(", ")}.`
    );
  }
}

async function exchangeAuthCode(
  code: string,
  config: Required<ServerRuntimeConfig>
) {
  try {
    const response = await axios.post(AUTH_CONSTANTS.google.tokenUrl, null, {
      params: {
        client_id: config.public.googleClientId,
        client_secret: config.private.googleClientSecret,
        redirect_uri: config.public.googleOauthRedirectUri,
        code,
        grant_type: "authorization_code",
      },
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
    });
  }
}

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
    });
  }
}

async function findOrCreateUser(googleUser: GoogleUser) {
  if (!googleUser.email || !googleUser.email_verified) {
    throw createError({
      statusCode: 400,
      statusMessage: "Google profile must provide a verified email address.",
    });
  }

  let user = await UserModel.findOne({
    $or: [{ googleId: googleUser.sub }, { email: googleUser.email }],
  });

  if (!user) {
    user = await UserModel.create({
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split("@")[0],
      profilePhoto: googleUser.picture,
      googleId: googleUser.sub,
      provider: "google",
      role: UserRole.FieldOfficer, // Set default role
    });
    console.log(`Created new user from Google: ${user.email}`);
  } else if (!user.googleId) {
    user.googleId = googleUser.sub;
    user.provider = "google";
    user.profilePhoto = user.profilePhoto || googleUser.picture;
    await user.save();
    console.log(`Linked existing user ${user.email} with Google account.`);
  }

  return user;
}


export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const query = getQuery(event);
    const code = query.code as string | undefined;
    const error = query.error as string | undefined;

    if (error) {
      console.error("Google OAuth callback error:", error);
      return sendRedirect(event, `/login?error=oauth_denied`, 302);
    }

    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing authorization code from Google.",
      });
    }

    validateAuthEnv(config as ServerRuntimeConfig);

    const requiredConfig = config as Required<ServerRuntimeConfig>; // Assert the type after validation

    const { access_token } = await exchangeAuthCode(code, requiredConfig);
    const googleUser = await fetchGoogleUser(access_token);
    const user = await findOrCreateUser(googleUser);

    // CRITICAL FIX: Call sendAuthToken from server/utils/auth.ts
    // Pass user ID and user role (from the model)
    await sendAuthToken(event, user._id.toString(), user.role); // REMOVED jwtSecret parameter

    return sendRedirect(event, "/dashboard", 302);
  } catch (error: any) {
    console.error("Full Google OAuth callback processing failed:", error);
    const errorMessage =
      error.data?.message ||
      error.statusMessage ||
      "Google authentication failed. Please try again.";
    return sendRedirect(
      event,
      `/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`,
      302
    );
  }
});