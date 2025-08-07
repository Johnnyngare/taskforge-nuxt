// server/middleware/auth.ts
import { defineEventHandler, getCookie } from 'h3';
import { verifyJwt } from '~/server/utils/jwtHelper'; // <-- USE THE HELPER

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');

  if (!token) {
    return;
  }

  const decoded = verifyJwt(token);

  if (decoded) {
    event.context.user = decoded; // Attach user to context if token is valid
  }
});