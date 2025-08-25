//components/MapBase.vue
<template>
  <div :style="{ height: mapHeight, width: mapWidth }" class="map-wrapper rounded-xl overflow-hidden">
    <ClientOnly fallback-tag="div" fallback="Loading map...">
      <LMap 
        ref="mapRef" 
        :zoom="zoom" 
        :center="center" 
        :use-global-leaflet="false"
        @ready="onLMapInstanceReady"
        style="height: 100%;"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
        />
        <!-- Render slot content only when map is ready -->
        <slot v-if="isFullyReady" :map="mapInstance" :leaflet-module="L" />
      </LMap>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import type { Map as LeafletMapInstance, LatLngExpression } from 'leaflet';

interface Props {
  height?: string;
  width?: string;
  zoom?: number;
  center?: LatLngExpression;
  invalidateSizeTrigger?: unknown;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  width: '100%',
  zoom: 13,
  center: () => [0.0, 38.0],
});

const emit = defineEmits<{
  (e: 'map-ready', map: LeafletMapInstance, L: typeof import('leaflet')): void;
}>();

const mapRef = ref(null);
const mapInstance = ref<LeafletMapInstance | null>(null);
const L = ref<typeof import('leaflet') | null>(null);
const isFullyReady = ref(false);
const hasEmittedReady = ref(false);

const mapHeight = computed(() => props.height);
const mapWidth = computed(() => props.width);

async function onLMapInstanceReady(map: LeafletMapInstance) {
  console.log('MapBase.vue: <LMap> ready event received');
  mapInstance.value = map;
  
  // Dynamically import Leaflet only on client-side to avoid SSR issues
  if (process.client && !L.value) {
    try {
      const leafletModule = await import('leaflet');
      L.value = leafletModule.default;
      console.log('MapBase.vue: Leaflet module loaded dynamically');
    } catch (error) {
      console.error('MapBase.vue: Failed to load Leaflet:', error);
      return;
    }
  }
  
  if (L.value && !hasEmittedReady.value) {
    isFullyReady.value = true;
    hasEmittedReady.value = true;
    
    console.log('MapBase.vue: Emitting map-ready (map + L ready)');
    emit('map-ready', map, L.value);
    
    // Ensure proper sizing after emission
    nextTick(() => {
      map.invalidateSize({ pan: false });
      console.log('MapBase.vue: invalidateSize called after map-ready emission');
    });
  }
}

// InvalidateSize trigger watcher
watch(
  () => props.invalidateSizeTrigger,
  () => {
    if (mapInstance.value) {
      nextTick(() => {
        mapInstance.value?.invalidateSize({ pan: false });
        console.log('MapBase.vue: invalidateSize due to trigger change');
      });
    }
  }
);

// Center change watcher
watch(
  () => props.center,
  (newCenter) => {
    if (mapInstance.value && newCenter) {
      mapInstance.value.setView(newCenter, props.zoom);
      console.log('MapBase.vue: Map center updated to:', newCenter);
    }
  },
  { deep: true }
);

// Zoom change watcher
watch(
  () => props.zoom,
  (newZoom) => {
    if (mapInstance.value && newZoom !== undefined) {
      mapInstance.value.setZoom(newZoom);
      console.log('MapBase.vue: Map zoom updated to:', newZoom);
    }
  }
);

onBeforeUnmount(() => {
  console.log('MapBase.vue: Component unmounting');
});

// Expose methods and refs for parent components
defineExpose({
  mapInstance: readonly(mapInstance),
  leafletModule: readonly(L),
  isReady: readonly(isFullyReady),
  triggerInvalidateSize() {
    if (mapInstance.value) {
      nextTick(() => {
        mapInstance.value?.invalidateSize({ pan: false });
        console.log('MapBase.vue: Exposed invalidateSize called');
      });
    } else {
      console.warn('MapBase.vue: triggerInvalidateSize called before map ready');
    }
  },
});
</script>

<style scoped>
.map-wrapper {
  min-height: 100px;
  height: 100%;
  position: relative;
}

/* Ensure map tiles load properly */
.map-wrapper :deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

/* Loading fallback styling */
.map-wrapper :deep(div[fallback]) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #374151;
  color: #9CA3AF;
  font-size: 0.875rem;
  border-radius: 0.75rem;
}
</style>