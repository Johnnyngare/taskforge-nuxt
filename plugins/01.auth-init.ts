// plugins/01.auth-init.ts
export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth();
  
  // Only run on client-side and fetch user data once on app initialization
  try {
    await fetchUser();
  } catch (error) {
    // Silently handle - user is just not logged in
    console.debug('Auth plugin: User not authenticated');
  }
});