// composables/useApi.ts
import { useNuxtApp } from '#app';

export const useApi = () => {
  const nuxtApp = useNuxtApp();

  // Use $fetch.create to create a reusable instance with default options
  const api = $fetch.create({
    baseURL: '/api',

    // onRequest runs before every request is made
    onRequest({ options }) {
      // This logic handles client-side requests
      if (process.client) {
        const token = useCookie('auth_token').value;
        if (token) {
          options.headers = new Headers(options.headers);
          options.headers.set('Authorization', `Bearer ${token}`);
        }
      }

      // --- THE FIX IS HERE ---
      // This logic handles server-side requests (SSR)
      if (process.server) {
        // On the server, we get the request headers from the SSR context
        const eventHeaders = nuxtApp.ssrContext?.event.node.req.headers;
        if (eventHeaders?.cookie) {
          // Forward the user's cookie to the internal API call
          options.headers = new Headers(options.headers);
          options.headers.set('cookie', eventHeaders.cookie);
        }
      }
    },

    // Your onResponseError handler is good, no changes needed here
    async onResponseError({ response }) {
      if (response.status === 401) {
        console.error('API request unauthorized.');
        // On the client, you might want to redirect to login
        if (process.client) {
          // await navigateTo('/login');
        }
      }
    },
  });

  return api;
};