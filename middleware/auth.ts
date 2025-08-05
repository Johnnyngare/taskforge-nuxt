export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth();

  // Simple check - no async operations needed since plugin already ran
  if (!isAuthenticated.value) {
    const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
    if (!publicRoutes.includes(to.path)) {
      return navigateTo('/login', { replace: true });
    }
  }
});