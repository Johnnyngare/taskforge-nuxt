// middleware/02.auth.ts
// FIX: Correct import for useAuth (it's a named export)
import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to, from) => { // to/from are used, no _ prefix
  const { user, isAuthenticated, initialized, fetchUser } = useAuth();
  
  if (!initialized.value || !user.value) {
    console.log(`02.auth.ts (Route Middleware): User state not initialized/populated. Attempting fetchUser for route ${to.fullPath}.`);
    await fetchUser();
  }

  if (!isAuthenticated.value) {
    if (to.path !== '/login' && to.path !== '/register' && to.path !== '/') {
      console.log(`02.auth.ts (Route Middleware): Not authenticated. Redirecting from ${to.fullPath} to /login.`);
      return navigateTo('/login');
    }
  } else {
    if (to.path === '/login' || to.path === '/register' || to.path === '/') {
      console.log(`02.auth.ts (Route Middleware): Authenticated. Redirecting from ${to.fullPath} to /dashboard.`);
      return navigateTo('/dashboard');
    }
  }
});