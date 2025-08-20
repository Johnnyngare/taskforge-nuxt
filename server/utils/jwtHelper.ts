// server/utils/jwtHelper.ts

// Declare jwt as a variable that will hold the jsonwebtoken module.
// It will only be assigned if running on the server.
let jwtPromise: Promise<typeof import('jsonwebtoken') | null> = Promise.resolve(null);

// Conditionally load jsonwebtoken ONLY on the server side using dynamic import.
// This is the correct way to import CJS modules conditionally in ESM.
if (process.server) {
  // Use a dynamic import to load jsonwebtoken. This returns a Promise.
  // The 'default' property is accessed because CJS modules imported dynamically
  // in ESM often expose their exports under a 'default' property.
  jwtPromise = import('jsonwebtoken')
    .then(module => module.default || module) // Access .default if it's there, else use module directly
    .catch(e => {
      console.error('FATAL (server-side): Could not load jsonwebtoken using dynamic import:', (e as Error).message);
      return null;
    });
}

// This interface is only used on the server
interface JwtPayload {
  id: string;
  role: string;
}

// This function will only ever be called on the server
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const jwtModule = await jwtPromise; // Await the module loading
  
  if (!jwtModule) {
    console.warn('verifyJwt called in an environment where jsonwebtoken is not loaded (likely client, or failed server load).');
    return null;
  }

  const config = useRuntimeConfig(); // useRuntimeConfig is available in server context
  const jwtSecret = config.private.jwtSecret;

  if (!jwtSecret) {
    console.error('JWT secret is not configured on the server.');
    return null;
  }

  try {
    const decoded = jwtModule.verify(token, jwtSecret) as JwtPayload;
    console.log("JWT Helper: Token verified successfully."); // Add log
    return decoded;
  } catch (error) {
    console.error('JWT Verification failed:', (error as Error).message);
    return null;
  }
}

// This function will only ever be called on the server
export async function signJwt(payload: object): Promise<string> {
  const jwtModule = await jwtPromise; // Await the module loading

  if (!jwtModule) {
    console.warn('signJwt called in an environment where jsonwebtoken is not loaded (likely client, or failed server load).');
    throw new Error('jsonwebtoken module not available.');
  }

  const config = useRuntimeConfig();
  const jwtSecret = config.private.jwtSecret;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }

  try {
    const signedToken = jwtModule.sign(payload, jwtSecret, { expiresIn: '7d' });
    console.log("JWT Helper: Token signed successfully."); // Add log
    return signedToken;
  } catch (error) {
    console.error('JWT Signing FAILED in Helper:', (error as Error).message);
    throw error;
  }
}