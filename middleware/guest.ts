// middleware/guest.ts (Simpler version)

import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated.value) {
    // If authenticated, prevent access to guest-only pages
    console.log(`guest.ts: Authenticated user attempting to access guest route ${to.fullPath}. Redirecting to /dashboard.`);
    return navigateTo('/dashboard');
  }
});