// middleware/admin.ts
import { useAuth } from "~/composables/useAuth";
import { navigateTo } from '#app';
import { watch } from 'vue'; // Explicitly import watch

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isAdmin, initialized, fetchUser } = useAuth();

  // CRITICAL FIX: If not initialized, fetch user. This needs to be awaited.
  if (!initialized.value) {
    console.log(`admin.ts: Auth state not initialized for route ${to.fullPath}. Attempting fetchUser.`);
    await fetchUser(); // Ensure fetchUser runs and completes
  }

  // Now, check auth state and role *after* initialization attempt
  if (isAuthenticated.value && !isAdmin.value) {
    console.log(
      `admin.ts: Authenticated but non-admin user attempting to access admin route ${to.fullPath}. Redirecting to /dashboard.`
    );
    // Use { replace: true } to prevent back button issues
    return navigateTo("/dashboard", { replace: true });
  }
  console.log(`admin.ts: User is admin or unauthenticated on admin route ${to.fullPath}. Allowing access.`);
  // No explicit return needed if middleware should allow passage
});