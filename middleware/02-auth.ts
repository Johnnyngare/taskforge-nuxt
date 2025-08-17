// middleware/02-auth.ts
// This is the correct and only content for this file.

import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, isAuthenticated, initialized, fetchUser } = useAuth();

  console.log(`[Middleware 02.auth] Processing route: ${to.fullPath}. From: ${from.fullPath}. User authenticated: ${isAuthenticated.value}. Initialized: ${initialized.value}`);

  if (!initialized.value && process.client) {
    console.log(`[Middleware 02.auth] Client: Auth state not initialized, attempting fetchUser before redirect decisions.`);
    await fetchUser();
    console.log(`[Middleware 02.auth] Client: fetchUser completed. isAuthenticated: ${isAuthenticated.value}.`);
  }

  const publicPaths = ['/', '/login', '/register'];
  const isPublicPath = publicPaths.includes(to.path);
  const authDashboardRoot = '/dashboard';
  const authProjectsList = '/dashboard/projects';

  // Scenario 1: User is NOT authenticated
  if (!isAuthenticated.value) {
    if (!isPublicPath) {
      console.log(`[Middleware 02.auth] Not authenticated. Redirecting from ${to.fullPath} to /login.`);
      return navigateTo('/login', { replace: true });
    }
    console.log(`[Middleware 02.auth] Not authenticated but on public path ${to.fullPath}. Allowing access.`);
    return;
  } else { // Scenario 2: User IS authenticated
    if (isPublicPath) {
      // If authenticated and trying to access a public auth path (/login, /register, /)
      // Redirect to /dashboard (the root of authenticated area) only if not already there
      if (to.path !== authDashboardRoot) { // CRITICAL CHANGE: Redirect to dashboard root if trying to access public paths
        console.log(`[Middleware 02.auth] Authenticated. Redirecting from public path ${to.fullPath} to ${authDashboardRoot}.`);
        return navigateTo(authDashboardRoot, { replace: true });
      }
    }
    // If authenticated and on a protected path (e.g., /dashboard, /dashboard/projects, or dynamic child routes), allow access.
    console.log(`[Middleware 02.auth] Authenticated and on protected/dashboard path ${to.fullPath}. Allowing access.`);
    return;
  }
});