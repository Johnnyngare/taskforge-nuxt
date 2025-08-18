// middleware/guest.ts
import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';
import { watch } from 'vue'; // Explicitly import watch if used in promise

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, initialized, fetchUser } = useAuth();

  // CRITICAL FIX: If not initialized, fetch user. This needs to be awaited.
  // If `process.server` then `fetchUser` will hydrate from context.
  // If `process.client` then `fetchUser` might do API call.
  if (!initialized.value) {
    console.log(`guest.ts: Auth state not initialized for route ${to.fullPath}. Attempting fetchUser.`);
    await fetchUser(); // Ensure fetchUser runs and completes
    // After fetchUser completes, isAuthenticated and initialized will be updated.
  }
  
  // Now, check isAuthenticated *after* fetchUser has completed its initialization attempt
  if (isAuthenticated.value) {
    console.log(
      `guest.ts: Authenticated user attempting to access guest route ${to.fullPath}. Redirecting to /dashboard.`
    );
    // Use { replace: true } to prevent back button issues
    return navigateTo('/dashboard', { replace: true });
  }
  console.log(`guest.ts: Unauthenticated user on guest route ${to.fullPath}. Allowing access.`);
  // No explicit return needed if middleware should allow passage
});