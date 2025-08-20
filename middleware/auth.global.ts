// middleware/auth.global.ts
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, fetchUser } = useAuth();

  // Always ensure the user's state is resolved before making routing decisions.
  await fetchUser();

  const isGuestRoute = ['/login', '/register', '/'].includes(to.path);
  const isProtected = to.path.startsWith('/dashboard');

  // Scenario 1: User is authenticated
  if (isAuthenticated.value) {
    // If an authenticated user tries to visit a guest-only page, redirect them.
    if (isGuestRoute) {
      return navigateTo('/dashboard', { replace: true });
    }
  }
  // Scenario 2: User is NOT authenticated
  else {
    // If an unauthenticated user tries to visit a protected page, redirect them.
    if (isProtected) {
      return navigateTo('/login', { replace: true });
    }
  }
  // Otherwise, allow navigation.
});