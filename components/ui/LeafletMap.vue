<!-- components/ui/LeafletMap.vue -->
<template>
  <div
    ref="mapContainer"
    class="leaflet-map-container"
    :style="{ height: height, width: width }"
  >
    <!--
      The slot now passes the map instance up to the parent component.
      This allows the parent to control what is drawn on the map (e.g., markers).
      We use v-if to ensure the slot content is only rendered after the map is initialized.
    -->
    <slot v-if="mapInstance" :map="mapInstance" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, markRaw, onBeforeUnmount } from 'vue';
import 'leaflet/dist/leaflet.css'; // Crucial: Import Leaflet's CSS
import { useLeaflet } from '~/composables/useLeaflet'; // Our new composable
import type { Map as LeafletMapInstance, LatLngExpression } from 'leaflet';

interface Props {
  height?: string;
  width?: string;
  zoom?: number;
  center?: LatLngExpression;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  width: '100%',
  zoom: 13,
  center: () => [51.505, -0.09],
});

const emit = defineEmits<{
  (e: 'map-ready', map: LeafletMapInstance): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<LeafletMapInstance | null>(null);

// Use our composable to get the Leaflet library object (L).
// `leaflet` is a ref, so we'll access it with .value
const { leaflet } = useLeaflet();

// We watch the `leaflet` ref. Once it's loaded by the composable, we can init the map.
watch(leaflet, (L) => {
  // Ensure L is loaded, we have a container, and the map isn't already initialized
  if (L && mapContainer.value && !mapInstance.value) {
    const map = L.map(mapContainer.value).setView(props.center, props.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Store the raw map instance (it's not reactive) and emit it.
    mapInstance.value = markRaw(map);
    emit('map-ready', map);
  }
});

// Watch for programmatic changes to the center prop
watch(
  () => props.center,
  (newCenter) => {
    if (mapInstance.value && newCenter) {
      mapInstance.value.setView(newCenter, props.zoom);
    }
  },
  { deep: true }
);

// Clean up the map instance when the component is destroyed
onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.remove();
    mapInstance.value = null;
  }
});
</script>

<style>
.leaflet-map-container {
  z-index: 1;
  border-radius: 0.75rem;
  overflow: hidden;
}
.leaflet-container {
  height: 100%;
  width: 100%;
}
</style>