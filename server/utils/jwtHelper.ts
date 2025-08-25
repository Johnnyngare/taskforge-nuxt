// C:/Users/HomePC/taskforge-nuxt/server/utils/jwtHelper.ts

// Declare jwt as a variable that will hold the jsonwebtoken module.
let jwtModulePromise: Promise<typeof import('jsonwebtoken').Module | null> = Promise.resolve(null); // Changed type to .Module

// Conditionally load jsonwebtoken ONLY on the server side using dynamic import.
if (process.server) {
  jwtModulePromise = import('jsonwebtoken')
    .then(module => {
      // Access .default if it's there (common for CJS in ESM), else use module directly
      return (module as any).default || module;
    })
    .catch(e => {
      console.error('FATAL (server-side): Could not load jsonwebtoken using dynamic import:', (e as Error).message);
      return null;
    });
}

// Interface for what we expect in the JWT payload
interface AppJwtPayload {
  id: string;
  role?: string; // Role might be optional depending on where it's signed
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * Retrieves the JWT secret from runtimeConfig.
 */
function getJwtSecret(): string {
  const config = useRuntimeConfig(); // useRuntimeConfig is available in server context
  const jwtSecret = config.private.jwtSecret; // Access private secret

  if (!jwtSecret) {
    console.error('CRITICAL ERROR: JWT secret is NOT configured on the server. Check .env and nuxt.config.ts.');
    throw new Error('JWT_SECRET is not configured on the server. Cannot proceed with JWT operations.');
  }
  return jwtSecret;
}

/**
 * Verifies a JWT token. This function should only ever be called on the server.
 * @param token The JWT string.
 * @returns Decoded payload or null if verification fails.
 */
export async function verifyJwt(token: string): Promise<AppJwtPayload | null> {
  const jwtModule = await jwtModulePromise; // Await the module loading
  
  if (!jwtModule) {
    console.warn('verifyJwt called in an environment where jsonwebtoken is not loaded (likely client, or failed server load).');
    return null;
  }

  const jwtSecret = getJwtSecret(); // Get the secret reliably

  try {
    // CRITICAL: Log the secret used for verification (first 10 chars)
    console.log("JWT Helper: Using JWT Secret for VERIFICATION (first 10 chars):", jwtSecret.substring(0, 10) + '...');

    const decoded = jwtModule.verify(token, jwtSecret) as AppJwtPayload;
    console.log("JWT Helper: Token verified successfully. Decoded ID:", decoded.id); // Log success
    return decoded;
  } catch (error) {
    console.error('JWT Helper: Token verification failed:', (error as Error).message);
    return null;
  }
}

/**
 * Signs a JWT token with a given payload. This function should only ever be called on the server.
 * @param payload The data to sign into the token.
 * @returns The signed JWT string.
 */
export async function signJwt(payload: object, expiresIn: string = '7d'): Promise<string> {
  const jwtModule = await jwtModulePromise; // Await the module loading

  if (!jwtModule) {
    console.warn('signJwt called in an environment where jsonwebtoken is not loaded (likely client, or failed server load).');
    throw new Error('jsonwebtoken module not available for signing.');
  }

  const jwtSecret = getJwtSecret(); // Get the secret reliably

  try {
    const signedToken = jwtModule.sign(payload, jwtSecret, { expiresIn });
    console.log("JWT Helper: Token signed successfully (first 10 chars secret):", jwtSecret.substring(0, 10) + '...'); // Add log
    return signedToken;
  } catch (error) {
    console.error('JWT Helper: Token signing FAILED:', (error as Error).message);
    throw error;
  }
}