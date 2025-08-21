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
  Marker as LeafletMarker,
} from 'leaflet';

const props = defineProps<{ tasks: ITask[] | null; }>();

const { leaflet: L } = useLeaflet();

const fieldTasksWithValidLocation = computed(() => {
  if (!Array.isArray(props.tasks)) return [];
  const filtered = props.tasks.filter(
    (task) =>
      task.taskType === TaskType.Field &&
      task.location?.type === 'Point' &&
      Array.isArray(task.location.coordinates) &&
      task.location.coordinates.length === 2
  );
  return filtered;
});

const mapInstance = ref<LeafletMapInstance | null>(null);
const markerLayer = ref<LayerGroup | null>(null);
const markers = ref<Map<string, LeafletMarker>>(new Map());

const initialMapZoom = 2; // For global overview
const initialMapCenter = ref<LatLngExpression>([20, 0]);

const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  // --- THE FIX: Ensure L.value is available before adding layer ---
  if (L.value) {
    markerLayer.value = L.value.layerGroup().addTo(map);
  }
};

watch(
  fieldTasksWithValidLocation, // Only need to watch this
  (tasks) => {
    // --- THE FIX: Add a comprehensive guard at the top of the watcher ---
    // Ensure both Leaflet library (L.value) AND the map/markerLayer are ready.
    if (!L.value || !mapInstance.value || !markerLayer.value) {
      return;
    }

    // Now, within this block, TypeScript knows L.value, mapInstance.value,
    // and markerLayer.value are all non-null.

    markerLayer.value.clearLayers();
    markers.value.clear();

    if (tasks.length === 0) {
      mapInstance.value.setView(initialMapCenter.value, initialMapZoom);
      return;
    }

    const latLngs: LatLngExpression[] = [];
    tasks.forEach((task) => {
      const coords = task.location!.coordinates;
      const latLng: LatLngExpression = [coords[1], coords[0]];
      latLngs.push(latLng);

      const popupContent = `<b>${task.title}</b><br>${task.description || ''}`;
      try {
        const marker = L.value // L.value is guaranteed non-null here
          .marker(latLng)
          .addTo(markerLayer.value) // markerLayer.value is guaranteed non-null here
          .bindPopup(popupContent);
        markers.value.set(task.id, marker);
      } catch (e) {
        console.error('DashboardFieldTasksMap: Error adding marker for task:', task.title, e);
      }
    });

    if (latLngs.length > 0) {
      const bounds = L.value.latLngBounds(latLngs); // L.value is guaranteed non-null here
      if (bounds.isValid()) {
        mapInstance.value.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  },
  { deep: true, immediate: true }
);

const focusOnTask = (task: ITask) => {
  // This guard is already correct and robust.
  if (!mapInstance.value || !task.location || !task.id) return;

  const marker = markers.value.get(task.id);
  if (marker) {
    // L.value is not guaranteed here, but marker methods don't strictly need it in current logic
    const latLng = marker.getLatLng();
    mapInstance.value.setView(latLng, 15);
    marker.openPopup();
  }
};

defineExpose({
  focusOnTask,
});
</script>