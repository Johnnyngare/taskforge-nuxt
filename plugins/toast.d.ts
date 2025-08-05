// plugins/toast.d.ts
// This file extends the NuxtApp interface to include $toast property.
import { UseToastReturn } from '@nuxt/ui/dist/runtime/types'; // Import the type from @nuxt/ui

declare module '#app' {
  interface NuxtApp {
    $toast: UseToastReturn;
  }
}

// You might also need to add this to your tsconfig.json includes,
// though Nuxt typically picks up files in `plugins/` automatically.