<!-- components/dashboard/DashboardFieldTasksMap.vue -->
<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-md">
    <h2 class="mb-4 text-xl font-semibold text-slate-200">Field Task Map</h2>

    <div v-if="fieldTasksWithValidLocation.length > 0">
      <UiLeafletMap
        height="400px"
        :zoom="initialMapZoom"
        :center="initialMapCenter"
        @map-ready="onMapReady"
      />
    </div>
    <div v-else class="py-8 text-center text-sm text-slate-400">
      No field tasks to display on the map.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TaskType, type ITask } from '~/types/task';
import { useLeaflet } from '~/composables/useLeaflet';
import UiLeafletMap from '~/components/ui/LeafletMap.vue';
import type {
  Map as LeafletMapInstance,
  LatLngExpression,
  LayerGroup,
  Marker as LeafletMarker, // NEW: Import Marker type
} from 'leaflet';

// The props definition remains the same. It receives tasks from the parent.
const props = defineProps<{
  tasks: ITask[] | null; // Allow null for initial loading state
}>();

const { leaflet: L } = useLeaflet();

const fieldTasksWithValidLocation = computed(() => {
  if (!Array.isArray(props.tasks)) return [];
  return props.tasks.filter(
    (task) =>
      task.taskType === TaskType.Field &&
      task.location?.type === 'Point' &&
      Array.isArray(task.location.coordinates) &&
      task.location.coordinates.length === 2
  );
});

const mapInstance = ref<LeafletMapInstance | null>(null);
const markerLayer = ref<LayerGroup | null>(null);
// NEW: A Map to store marker instances, keyed by task ID. This is crucial for finding them later.
const markers = ref<Map<string, LeafletMarker>>(new Map());
const initialMapZoom = 2;
const initialMapCenter = ref<LatLngExpression>([20, 0]);

const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  if (L.value) {
    markerLayer.value = L.value.layerGroup().addTo(map);
  }
};

// This watcher automatically redraws markers whenever the task list changes.
watch(
  fieldTasksWithValidLocation,
  (tasks) => {
    if (!mapInstance.value || !markerLayer.value || !L.value) return;

    // 1. Clear all old markers from the layer and our internal map.
    markerLayer.value.clearLayers();
    markers.value.clear();

    if (tasks.length === 0) {
      mapInstance.value.setView(initialMapCenter.value, initialMapZoom);
      return;
    }

    // 2. Create new markers and add them to our internal map.
    const latLngs: LatLngExpression[] = [];
    tasks.forEach((task) => {
      const coords = task.location!.coordinates;
      const latLng: LatLngExpression = [coords[1], coords[0]];
      latLngs.push(latLng);

      const popupContent = `<b>${task.title}</b><br>${task.description || ''}`;
      const marker = L.value
        .marker(latLng)
        .addTo(markerLayer.value)
        .bindPopup(popupContent);

      // Store the marker instance with its task ID for future access
      markers.value.set(task.id, marker);
    });

    // 3. Fit the map view to all markers.
    if (latLngs.length > 0) {
      const bounds = L.value.latLngBounds(latLngs);
      if (bounds.isValid()) {
        mapInstance.value.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  },
  { deep: true }
);

// NEW: This function will be called by the parent page.
const focusOnTask = (task: ITask) => {
  if (!mapInstance.value || !task.location || !task.id) return;

  // Find the marker using the task ID
  const marker = markers.value.get(task.id);
  if (marker) {
    const latLng = marker.getLatLng();
    mapInstance.value.setView(latLng, 15); // Zoom in to a close-up level
    marker.openPopup(); // Open its popup for emphasis
  }
};

// NEW: Expose the 'focusOnTask' function so the parent component can call it.
defineExpose({
  focusOnTask,
});
</script>