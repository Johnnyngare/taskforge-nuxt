// C:/Users/HomePC/taskforge-nuxt/server/api/oauth/google/callback.get.ts
import {
  defineEventHandler,
  getQuery,
  createError,
  sendRedirect,
  H3Event,
} from "h3";
import axios, { AxiosError } from "axios";
import { UserModel, type IUserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";
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
  database: {
    queryTimeoutMs: 10000, // 10 second timeout instead of 30
    connectionTimeoutMs: 15000, // 15 second connection timeout
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
    baseUrlPublic?: string;
    uploadsBaseUrl?: string;
    authUrl?: string;
  };
  private: {
    jwtSecret?: string;
    googleClientSecret?: string;
    mongodbUri?: string;
    authSecret?: string;
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
      timeout: AUTH_CONSTANTS.database.connectionTimeoutMs, // Add timeout to axios call
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
        timeout: AUTH_CONSTANTS.database.connectionTimeoutMs, // Add timeout to axios call
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

  console.log(`🔍 Searching for existing user with email: ${googleUser.email} or Google ID: ${googleUser.sub}`);
  
  let user: IUserModel | null = null;
  
  try {
    // FIXED: Add timeout and lean() for faster queries
    user = await UserModel.findOne({
      $or: [{ googleId: googleUser.sub }, { email: googleUser.email }],
    })
    .lean() // Returns plain JavaScript object instead of Mongoose document (faster)
    .maxTimeMS(AUTH_CONSTANTS.database.queryTimeoutMs) // 10 second timeout instead of 30
    .exec(); // Explicitly execute the query

    console.log(`📊 Database query completed. User ${user ? 'found' : 'not found'}`);

  } catch (dbError: any) {
    console.error("❌ Database query failed:", dbError);
    
    // If the query fails due to timeout, we'll handle it gracefully
    if (dbError.message?.includes('timeout') || dbError.message?.includes('buffering')) {
      console.log("⚠️ Database timeout detected. Will attempt user creation anyway.");
      user = null; // Proceed as if user doesn't exist
    } else {
      throw dbError; // Re-throw non-timeout errors
    }
  }

  if (!user) {
    console.log("👤 Creating new user...");
    try {
      // FIXED: Add timeout to create operation as well
      user = await UserModel.create({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        profilePhoto: googleUser.picture,
        googleId: googleUser.sub,
        provider: "google",
        role: UserRole.FieldOfficer,
      });
      
      console.log(`✅ Created new user from Google: ${user.email} (ID: ${user._id})`);
      
    } catch (createError: any) {
      console.error("❌ Failed to create new user:", createError);
      
      // If user creation fails, check if it's a duplicate key error (user was created by another request)
      if (createError.code === 11000) {
        console.log("⚠️ Duplicate user detected. Attempting to find existing user...");
        try {
          user = await UserModel.findOne({ email: googleUser.email })
            .lean()
            .maxTimeMS(5000) // Shorter timeout for retry
            .exec();
          
          if (user) {
            console.log("✅ Found existing user on retry");
          } else {
            throw new Error("User creation conflict but cannot find existing user");
          }
        } catch (retryError) {
          console.error("❌ Retry query also failed:", retryError);
          throw retryError;
        }
      } else {
        throw createError; // Re-throw non-duplicate errors
      }
    }
  } else {
    console.log(`✅ Existing user found: ${user.email} (ID: ${user._id})`);
    
    // If user exists but doesn't have googleId, link the accounts
    if (!user.googleId) {
      console.log("🔗 Linking existing user with Google account...");
      try {
        // FIXED: Convert lean object back to Mongoose document for updates
        const userDoc = await UserModel.findById(user._id).maxTimeMS(AUTH_CONSTANTS.database.queryTimeoutMs);
        if (userDoc) {
          userDoc.googleId = googleUser.sub;
          userDoc.provider = "google";
          userDoc.profilePhoto = userDoc.profilePhoto || googleUser.picture;
          
          await userDoc.save();
          user = userDoc.toObject(); // Convert back to plain object
          console.log(`✅ Linked existing user ${user.email} with Google account.`);
        }
      } catch (updateError) {
        console.error("⚠️ Failed to link Google account, but proceeding with login:", updateError);
        // Don't throw here - user can still log in even if linking fails
      }
    }
  }

  if (!user) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create or retrieve user account.",
    });
  }

  return user;
}

export default defineEventHandler(async (event) => {
  console.log("--- Google OAuth Callback Handler STARTED ---");
  const url = getRequestURL(event);
  console.log(`Request URL: ${url.href}`);
  console.log(`Request Path: ${url.pathname}`);
  console.log(`Request Query: ${url.search}`);

  try {
    const config = useRuntimeConfig(event);

    console.log("Runtime Config (Public) for Callback:", {
      googleClientId: config.public.googleClientId ? "PRESENT" : "MISSING",
      googleOauthRedirectUri: config.public.googleOauthRedirectUri,
      baseUrlPublic: config.public.baseUrlPublic,
      uploadsBaseUrl: config.public.uploadsBaseUrl,
      authUrl: config.public.authUrl,
    });
    console.log("Runtime Config (Private) for Callback:", {
      googleClientSecret: config.private.googleClientSecret ? "PRESENT" : "MISSING",
      jwtSecret: config.private.jwtSecret ? "PRESENT" : "MISSING",
      mongodbUri: config.private.mongodbUri ? "PRESENT" : "MISSING",
      authSecret: config.private.authSecret ? "PRESENT" : "MISSING",
    });

    const query = getQuery(event);
    const code = query.code as string | undefined;
    const error = query.error as string | undefined;

    console.log(`Query Params - code: ${code ? 'PRESENT' : 'MISSING'}, error: ${error || 'NONE'}`);

    if (error) {
      console.error("Google OAuth callback error:", error);
      return sendRedirect(event, `/login?error=oauth_denied`, 302);
    }

    if (!code) {
      console.error("Missing authorization code from Google in callback.");
      throw createError({
        statusCode: 400,
        statusMessage: "Missing authorization code from Google.",
      });
    }

    validateAuthEnv(config as ServerRuntimeConfig);
    console.log("All critical Auth environment variables validated successfully.");

    const requiredConfig = config as Required<ServerRuntimeConfig>;

    const { access_token } = await exchangeAuthCode(code, requiredConfig);
    console.log(`Successfully exchanged code for access token. Access token (truncated): ${access_token ? access_token.substring(0, 10) + '...' : 'N/A'}`);
    
    const googleUser = await fetchGoogleUser(access_token);
    console.log(`Successfully fetched Google user info for email: ${googleUser.email}`);

    const user = await findOrCreateUser(googleUser);
    console.log(`User processed successfully: ID ${user._id}, Email: ${user.email}`);

    await sendAuthToken(event, user._id.toString(), user.role); 
    console.log("Auth cookie operation completed. Redirecting to dashboard.");

    return sendRedirect(event, "/dashboard", 302);
    
  } catch (error: any) {
    console.error("--- FULL Google OAuth callback processing FAILED ---", error);
    
    // More specific error handling
    let errorMessage = "Google authentication failed. Please try again.";
    if (error.message?.includes('timeout')) {
      errorMessage = "Database connection timed out. Please try again.";
    } else if (error.message?.includes('network')) {
      errorMessage = "Network error occurred. Please check your connection.";
    } else if (error.statusMessage) {
      errorMessage = error.statusMessage;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }
    
    console.error(`Redirecting to /login with error: ${errorMessage}`);
    return sendRedirect(
      event,
      `/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`,
      302
    );
  } finally {
    console.log("--- Google OAuth Callback Handler FINISHED ---");
  }
});