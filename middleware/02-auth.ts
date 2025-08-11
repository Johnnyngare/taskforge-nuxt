// middleware/02.auth.ts

import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app'; // Ensure navigateTo is imported

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, isAuthenticated, initialized, fetchUser } = useAuth();
  
  // This middleware runs UNIVERSALLY (server for SSR, client for navigation).
  // It uses useAuth() state to make routing decisions.

  // If user state is not yet initialized or populated, try to fetch it.
  // fetchUser handles the process.server/client distinction for populating state.
  if (!initialized.value || !user.value) {
    console.log(`02.auth.ts (Route Middleware): User state not initialized/populated. Attempting fetchUser for route ${to.fullPath}.`);
    await fetchUser(); // This will populate the user state from SSR or client /me API
  }

  // After fetchUser has run (or skipped), now check authentication based on the updated state.
  if (!isAuthenticated.value) {
    // User is NOT authenticated.
    // If trying to access a protected route (not login, register, or index/landing)
    if (to.path !== '/login' && to.path !== '/register' && to.path !== '/') {
      console.log(`02.auth.ts (Route Middleware): Not authenticated. Redirecting from ${to.fullPath} to /login.`);
      return navigateTo('/login');
    }
  } else {
    // User IS authenticated.
    // If trying to access guest-only pages (login/register)
    if (to.path === '/login' || to.path === '/register' || to.path === '/') { // Also redirect from '/' if authenticated
      console.log(`02.auth.ts (Route Middleware): Authenticated. Redirecting from ${to.fullPath} to /dashboard.`);
      return navigateTo('/dashboard');
    }
  }
});