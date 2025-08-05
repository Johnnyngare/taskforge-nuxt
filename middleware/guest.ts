export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth();

  // Simple check - no async operations needed since plugin already ran
  if (isAuthenticated.value) {
    return navigateTo("/dashboard", { replace: true });
  }
});
