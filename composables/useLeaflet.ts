// composables/useLeaflet.ts
// This file is correct and requires no changes.
import { ref, onMounted } from 'vue';

let isLeafletInitialized = false;

export function useLeaflet() {
  const leaflet = ref<typeof import('leaflet') | null>(null);

  onMounted(async () => {
    if (process.client) {
      const L = await import('leaflet');
      import('leaflet/dist/leaflet.css');

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