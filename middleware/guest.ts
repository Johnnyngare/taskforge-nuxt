// taskforge-nuxt/middleware/guest.ts
// This middleware prevents authenticated users from accessing guest-only pages (like login/register)
export default defineNuxtRouteMiddleware((to, from) => {
  // Assuming useAuth() correctly manages the 'user' state (null if not logged in)
  const { user } = useAuth();

  // If the user is already logged in, redirect them to the dashboard
  if (user.value) {
    // console.log(`Guest middleware: User is logged in (${user.value.email}), redirecting from ${to.fullPath} to /dashboard`);
    return navigateTo("/dashboard");
  }
  // If user is not logged in, allow them to proceed to the guest page
});
