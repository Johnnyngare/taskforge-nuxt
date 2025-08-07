// middleware/admin.ts
import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, isAdmin } = useAuth();

  // This middleware should run after the 'auth' middleware,
  // so we can assume the user is logged in.
  if (isAuthenticated.value && !isAdmin.value) {
    // If the user is logged in but is NOT an admin,
    // redirect them away from the admin page.
    return navigateTo("/dashboard", { replace: true });
  }
});
