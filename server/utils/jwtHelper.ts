// server/utils/jwtHelper.ts

import jwt from 'jsonwebtoken';
import type { RuntimeConfig } from '@nuxt/schema';
import { useRuntimeConfig } from '#imports';

// This interface is only used on the server
interface JwtPayload {
  id: string;
  role: string;
}

// This function will only ever be called on the server
export function verifyJwt(token: string): JwtPayload | null {
  const config = useRuntimeConfig();
  const jwtSecret = config.private.jwtSecret;

  if (!jwtSecret) {
    console.error('JWT secret is not configured on the server.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('JWT Verification failed:', (error as Error).message);
    return null;
  }
}

// This function will only ever be called on the server
export function signJwt(payload: object): string {
  const config = useRuntimeConfig();
  const jwtSecret = config.private.jwtSecret;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}