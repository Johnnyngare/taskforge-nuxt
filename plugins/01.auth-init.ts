// plugins/01.auth-init.ts
// FIX: Correct import for useAuth (it's a named export)
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  await nuxtApp.runWithContext(async () => {
    const { fetchUser, user, initialized } = useAuth();
    
    if (process.server) {
      if (!user.value) { 
        try {
          await fetchUser();
          console.log("01.auth-init: Server-side fetchUser completed.");
        } catch (error: any) {
          console.debug('01.auth-init: Server-side fetchUser failed (user not authenticated).', error?.message || "Unknown error during auth init fetchUser (server).");
        }
      } else {
        console.log("01.auth-init: Server-side fetchUser skipped (user already in state).");
      }
    } else if (process.client) {
      nuxtApp.hook('app:beforeMount', async () => {
        if (!user.value && !initialized.value) { 
          try {
            await fetchUser();
            console.log("01.auth-init: Client-side fetchUser completed.");
          } catch (error: any) {
            console.debug('01.auth-init: Client-side fetchUser failed (user not authenticated or cookie issue).', error?.message || "Unknown error during auth init fetchUser (client).");
          }
        } else {
          console.log("01.auth-init: Client-side fetchUser skipped (user already hydrated or initialized).");
        }
      });
    }
  });
});