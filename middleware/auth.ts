// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth(); // We will create this composable next

  if (!user.value) {
    // If user is not logged in, redirect to login page
    return navigateTo("/login", { replace: true });
  }
});
