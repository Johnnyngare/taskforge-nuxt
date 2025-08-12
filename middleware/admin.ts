// middleware/admin.ts
// FIX: Correct import for useAuth (it's a named export)
import { useAuth } from "~/composables/useAuth";
import { navigateTo } from '#app';
import { watch } from 'vue';

export default defineNuxtRouteMiddleware((to, from) => { // to/from are used, no _ prefix
  const { isAuthenticated, isAdmin, initialized } = useAuth();

  // Ensure the auth state is initialized before checking roles
  if (!initialized.value) {
    return new Promise((resolve) => {
      const stop = watch(initialized, (val) => {
        if (val) {
          stop();
          if (isAuthenticated.value && !isAdmin.value) {
            resolve(navigateTo("/dashboard", { replace: true }));
          } else {
            resolve();
          }
        }
      }, { immediate: true });
    });
  }

  // Now do the check synchronously
  if (isAuthenticated.value && !isAdmin.value) {
    return navigateTo("/dashboard", { replace: true });
  }
});