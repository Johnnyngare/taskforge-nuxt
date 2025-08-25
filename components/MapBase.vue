<!-- C:/Users/HomePC/taskforge-nuxt/components/MapBase.vue -->
<template>
  <div :style="{ height: mapHeight, width: mapWidth }" class="map-wrapper rounded-xl overflow-hidden">
    <!-- CRITICAL: <ClientOnly> is used to ensure Leaflet only renders in the browser -->
    <ClientOnly fallback-tag="div" fallback="Loading map...">
      <!-- <LMap> is the main component from @nuxtjs/leaflet -->
      <LMap ref="mapRef" :zoom="zoom" :center="center" @ready="onMapReady">
        <!-- <LTileLayer> is used for the base map tiles -->
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
        />
        <!-- Slot for custom layers, markers, popups, etc., from parent components -->
        <slot :map="mapInstance" :leaflet-module="L_module_object" />
      </LMap>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useLeaflet as useNuxtLeaflet } from '#imports'; // Import the composable from @nuxtjs/leaflet
import type { Map as LeafletMapInstance, LatLngExpression } from 'leaflet'; // Import types from 'leaflet' directly

interface Props {
  height?: string; // e.g., '400px', '100%'
  width?: string;  // e.g., '100%', '800px'
  zoom?: number;
  center?: LatLngExpression; // [latitude, longitude]
  invalidateSizeTrigger?: any; // A prop that can be watched to trigger invalidateSize
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  width: '100%',
  zoom: 13,
  center: () => [0.0, 38.0], // Default to central Kenya
});

const emit = defineEmits<{
  (e: 'map-ready', map: LeafletMapInstance, L: typeof import('leaflet')): void;
}>();

const mapRef = ref(null); // Ref to the <LMap> component
const mapInstance = ref<LeafletMapInstance | null>(null); // Actual Leaflet map object
const L_module_object = ref<typeof import('leaflet') | null>(null); // Leaflet 'L' module object

const mapHeight = computed(() => props.height);
const mapWidth = computed(() => props.width);

// Composable from @nuxtjs/leaflet
// This composable ensures the Leaflet module (L) is available
// It typically returns a promise that resolves with the L module or exposes it directly
const { L: LeafletModule } = useNuxtLeaflet();

// Handler when the LMap component is fully initialized by Leaflet.js
const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  L_module_object.value = LeafletModule; // Store the Leaflet module object

  console.log('MapBase.vue: @nuxtjs/leaflet map ready!', {
    mapInstance: !!mapInstance.value,
    L_module_object: !!L_module_object.value,
  });

  // Emit the native Leaflet map instance and the L module object
  emit('map-ready', map, LeafletModule);
};

// --- invalidateSize() Handling for Modals / Visibility Changes ---
// This is crucial when a map is inside a hidden container that becomes visible.
watch(() => props.invalidateSizeTrigger, () => {
  if (mapInstance.value) {
    // We use nextTick to ensure the map container has been rendered and gained its dimensions
    // AFTER the trigger (e.g., modal opens, v-if becomes true).
    nextTick(() => {
      mapInstance.value?.invalidateSize({ pan: false });
      console.log('MapBase.vue: invalidateSize() called due to trigger.');
    });
  }
}, { deep: true, immediate: false }); // immediate: false as modal might not be visible initially

// Watch for external center/zoom changes from parent props
watch(() => props.center, (newCenter) => {
  if (mapInstance.value && newCenter) {
    mapInstance.value.setView(newCenter, props.zoom);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  if (mapInstance.value && newZoom !== undefined) {
    mapInstance.value.setZoom(newZoom);
  }
});


// Optional: Clean up on unmount (LMap component handles much of its own cleanup)
onBeforeUnmount(() => {
  if (mapInstance.value) {
    console.log('MapBase.vue: Cleaning up map instance on unmount.');
    // The @nuxtjs/leaflet components handle their own destroy,
    // but manually ensure event listeners are off if directly added to mapInstance
    // For now, rely on module's cleanup.
  }
});

// Expose internal Leaflet L object and map instance for advanced parent usage (e.g., adding custom layers)
defineExpose({
  mapInstance,
  L_module_object,
});
</script>

<style scoped>
/* Ensure the wrapper div takes up space */
.map-wrapper {
  /* Using TailwindCSS classes directly on the div is also good,
     but ensure it's not overriding necessary internal Leaflet styles. */
  min-height: 100px; /* Fallback min height */
}

/* You might need to add specific styles if the module's base styles need tweaking.
   However, the module usually handles this quite well. */
</style>