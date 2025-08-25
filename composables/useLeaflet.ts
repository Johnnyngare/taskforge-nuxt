// composables/useLeaflet.ts

import { ref, onMounted } from 'vue';

let isLeafletInitialized = false;

export function useLeaflet() {
  const leaflet = ref<typeof import('leaflet') | null>(null);

  onMounted(async () => {
    if (process.client) {
      const L = await import('leaflet');
      // REMOVED: import 'leaflet/dist/leaflet.css';
      // This CSS import is now handled globally in nuxt.config.ts for consistency and reliability.

      if (!isLeafletInitialized) {
        // These lines are critical for ensuring Leaflet's default marker icons load correctly
        // from local assets instead of trying to fetch them from a default CDN path (which often fails).
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