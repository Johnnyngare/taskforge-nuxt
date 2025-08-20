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
import { UserModel, type IUserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";

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

interface AppRuntimeConfig {
  jwtSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
}

interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

function validateAuthEnv(
  config: AppRuntimeConfig
): asserts config is Required<AppRuntimeConfig> {
  if (
    !config.googleClientId ||
    !config.googleClientSecret ||
    !config.jwtSecret ||
    !config.googleRedirectUri
  ) {
    throw new Error(
      "Critical OAuth configuration missing. Check .env and nuxt.config.ts."
    );
  }
}

async function exchangeAuthCode(
  code: string,
  config: Required<AppRuntimeConfig>
) {
  try {
    const response = await axios.post(AUTH_CONSTANTS.google.tokenUrl, null, {
      params: {
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
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
      role: UserRole.FieldOfficer,
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

function setAuthCookie(event: H3Event, user: IUserModel, jwtSecret: string) {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    // FIX: The jwtSecret is already guaranteed to be a string here
    jwtSecret,
    { expiresIn: AUTH_CONSTANTS.jwt.expiresIn }
  );

  setCookie(event, AUTH_CONSTANTS.jwt.cookie.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: AUTH_CONSTANTS.jwt.cookie.sameSite,
    path: AUTH_CONSTANTS.jwt.cookie.path,
    maxAge: AUTH_CONSTANTS.jwt.cookie.maxAge,
  });
  console.log("Auth cookie set successfully for user:", user.email);
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event) as AppRuntimeConfig;
    const query = getQuery(event);
    const code = query.code as string | undefined;
    const error = query.error as string | undefined;

    if (error) {
      console.error("Google OAuth callback error:", error);
      return sendRedirect(event, `/login?error=oauth_denied`);
    }

    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing authorization code from Google.",
      });
    }
    validateAuthEnv(config);

    const { access_token } = await exchangeAuthCode(code, config);
    const googleUser = await fetchGoogleUser(access_token);
    const user = await findOrCreateUser(googleUser);

    setAuthCookie(event, user, config.jwtSecret);

    return sendRedirect(event, "/dashboard");
  } catch (error: any) {
    console.error("Full Google OAuth callback processing failed:", error);
    const errorMessage =
      error.data?.message ||
      error.statusMessage ||
      "Google authentication failed. Please try again.";
    return sendRedirect(
      event,
      `/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`
    );
  }
});
