// middleware/guest.ts
// FIX: Correct import for useAuth (it's a named export)
import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to) => { // to is used, no _ prefix needed
  const { isAuthenticated, initialized, fetchUser } = useAuth(); // fetchUser is from useAuth itself

  // Ensure auth state is initialized before making a decision
  if (!initialized.value) {
    await fetchUser(); // Ensure fetchUser runs
  }

  if (isAuthenticated.value) {
    console.log(
      `guest.ts: Authenticated user attempting to access guest route ${to.fullPath}. Redirecting to /dashboard.`
    );
    return navigateTo('/dashboard');
  }
});