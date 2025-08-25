// C:/Users/HomePC/taskforge-nuxt/composables/useAppToast.ts
import { useToast as useNuxtUIToast } from '#imports';

/**
 * A mock/noop (no-operation) toast object for the server-side.
 * It has an `.add()` method that does nothing, preventing crashes during SSR
 * when a toast is triggered in server-only code (like middleware).
 */
const ssrToast = {
  add: (options: any) => {
    // On the server, we can optionally log that a toast was triggered for debugging.
    console.log(`[SSR Toast Triggered]: ${options.title}`);
  },
};

/**
 * This is the single, SSR-safe composable for showing notifications.
 * It is named `useAppToast` to avoid conflicts with Nuxt UI's `useToast`.
 * - On the client-side, it returns the real `useToast` from @nuxt/ui.
 * - On the server-side, it returns a mock object that does nothing, preventing crashes.
 */
export const useAppToast = () => {
  // `process.server` is a Nuxt global that is true during SSR.
  if (process.server) {
    return ssrToast;
  }

  // On the client, we return the actual toast function from Nuxt UI.
  // We use an alias on import to avoid ambiguity in this file.
  return useNuxtUIToast();
};