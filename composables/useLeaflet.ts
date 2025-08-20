// composables/useLeaflet.ts

import { ref, onMounted } from 'vue';

// A flag to ensure we only run the icon setup logic once.
let isLeafletInitialized = false;

export function useLeaflet() {
  const leaflet = ref<typeof import('leaflet') | null>(null);

  onMounted(async () => {
    if (process.client) {
      // Dynamically import Leaflet only on the client-side
      const L = await import('leaflet');

      // Run the icon fix only once per application lifecycle
      if (!isLeafletInitialized) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
          iconUrl: '/leaflet/images/marker-icon.png',
          shadowUrl: '/leaflet/images/marker-shadow.png',
        });
        isLeafletInitialized = true;
      }

      leaflet.value = L;
    }
  });

  return {
    leaflet,
  };
}