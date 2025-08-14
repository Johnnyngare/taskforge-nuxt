// plugins/01.auth-state-hydration.ts
import { defineNuxtPlugin } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuth();

  if (auth.initialized.value) {
    console.log(`[Plugin 01.auth-state-hydration] Auth state already initialized. Skipping plugin run.`);
    return;
  }

  if (process.server) {
    const serverUser = nuxtApp.ssrContext?.event?.context?.user;
    if (serverUser) {
      const plainUser = typeof serverUser.toJSON === 'function' ? serverUser.toJSON() : { ...serverUser };
      auth.setAuthenticatedUser(plainUser);
      console.log(`[Plugin 01.auth-state-hydration] SSR: Hydrated auth state from server context for user ${serverUser.id} (name: ${plainUser.name}).`);
    } else {
      console.log(`[Plugin 01.auth-state-hydration] SSR: No user in server context. Client will attempt fetch.`);
    }
  } else {
    console.log(`[Plugin 01.auth-state-hydration] Client: Ensuring auth state is initialized. Calling fetchUser.`);
    await auth.fetchUser();
  }
});