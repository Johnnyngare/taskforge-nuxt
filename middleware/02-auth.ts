// middleware/02-auth.ts

import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, isAuthenticated, initialized, fetchUser } = useAuth();

  console.log(`[Middleware 02.auth] Processing route: ${to.fullPath}. User authenticated: ${isAuthenticated.value}. Initialized: ${initialized.value}`);

  // CRITICAL: Ensure auth state is initialized before making redirect decisions.
  // This check serves as a fallback. The plugin `01.auth-state-hydration.ts` handles the primary initialization.
  if (!initialized.value && process.client) { // Only attempt client-side fetch if not initialized
    console.log(`[Middleware 02.auth] Client: Auth state not initialized, attempting fetchUser before redirect decisions.`);
    await fetchUser(); // This will populate `user` and `isAuthenticated`
    console.log(`[Middleware 02.auth] Client: fetchUser completed. isAuthenticated: ${isAuthenticated.value}.`);
  }

  // Define paths that do NOT require authentication
  const publicPaths = ['/', '/login', '/register'];
  const isPublicPath = publicPaths.includes(to.path);

  // Centralize main authenticated paths
  const authDashboardRoot = '/dashboard';
  const authProjectsList = '/dashboard/projects';

  // Scenario 1: User is NOT authenticated (after hydration/fetch)
  if (!isAuthenticated.value) {
    if (!isPublicPath) {
      // If trying to access a protected path while unauthenticated, redirect to login
      console.log(`[Middleware 02.auth] Not authenticated. Redirecting from ${to.fullPath} to /login.`);
      // IMPORTANT: Add abortNavigation() to prevent the original navigation from proceeding
      // if you are immediately navigating away.
      return navigateTo('/login', { replace: true });
    }
    // If unauthenticated and on a public path (like /login, /register, /), just allow access.
    console.log(`[Middleware 02.auth] Not authenticated but on public path ${to.fullPath}. Allowing access.`);
    return; // Explicitly return to allow navigation
  } else { // Scenario 2: User IS authenticated
    if (isPublicPath) {
      // If authenticated and trying to access a public auth path (/login, /register, /), redirect to dashboard root.
      // This prevents logged-in users from seeing login/register pages.
      // CRITICAL: Only redirect if NOT ALREADY on the dashboard root or projects list.
      if (to.path !== authDashboardRoot && to.path !== authProjectsList) {
          console.log(`[Middleware 02.auth] Authenticated. Redirecting from public path ${to.fullPath} to ${authDashboardRoot}.`);
          return navigateTo(authDashboardRoot, { replace: true });
      }
    }
    // If authenticated and on a protected path (or dashboard itself), just allow access.
    console.log(`[Middleware 02.auth] Authenticated and on protected/dashboard path ${to.fullPath}. Allowing access.`);
    return; // Explicitly return to allow navigation
  }
});