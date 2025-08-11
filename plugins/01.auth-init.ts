// plugins/01.auth-init.ts
export default defineNuxtPlugin(async (nuxtApp) => {
  const { fetchUser, user, initialized } = useAuth(); // Get user and initialized state
  
  // This plugin runs universally.
  // It's designed to ensure `useAuth().user` is populated correctly for the app.

  // Use nuxtApp.runWithContext to ensure composables run in the correct context.
  await nuxtApp.runWithContext(async () => {
    // If on server (SSR), ensure fetchUser populates user state
    if (process.server) {
      if (!user.value) { // Only fetch if user state is not already set by some prior SSR step
        try {
          await fetchUser(); // This call in fetchUser will attempt to hydrate from SSR event context
          console.log("01.auth-init: Server-side fetchUser completed.");
        } catch (error) {
          console.debug('01.auth-init: Server-side fetchUser failed (user not authenticated).');
        }
      } else {
        console.log("01.auth-init: Server-side fetchUser skipped (user already in state).");
      }
    } else if (process.client) {
      // On client-side, the `useState('user')` should automatically pick up SSR-hydrated state.
      // We only run fetchUser via API if it wasn't hydrated or if it was cleared (e.g., logout).
      // We also guard with app:beforeMount to ensure hydration is done.
      nuxtApp.hook('app:beforeMount', async () => {
        if (!user.value && !initialized.value) { // Only fetch if user is genuinely null and not initialized
          try {
            await fetchUser();
            console.log("01.auth-init: Client-side fetchUser completed.");
          } catch (error) {
            console.debug('01.auth-init: Client-side fetchUser failed (user not authenticated or cookie issue).');
          }
        } else {
          console.log("01.auth-init: Client-side fetchUser skipped (user already hydrated or initialized).");
        }
      });
    }
  });
});