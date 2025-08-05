// types/nuxt.d.ts

// NEW: This file augments Nuxt's default types.
// It makes TypeScript aware of the `$toast` object injected by @nuxt/ui.
declare module "#app" {
  interface NuxtApp {
    $toast: {
      add(notification: {
        id?: string;
        title: string;
        description?: string;
        icon?: string;
        color?: string;
        timeout?: number;
      }): void;
    };
  }
}

// This is required to make the augmentation work.
export {};