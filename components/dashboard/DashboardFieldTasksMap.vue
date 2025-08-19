<!-- components/dashboard/DashboardFieldTasksMap.vue -->
<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-md">
    <h2 class="mb-4 text-xl font-semibold text-slate-200">Field Task Map</h2>

    <div v-if="fieldTasks.length > 0">
      <!--
        The template is now much cleaner. We just render the base map.
        All marker logic has been moved to the script block.
      -->
      <UiLeafletMap
        height="500px"
        :zoom="initialMapZoom"
        :center="initialMapCenter"
        @map-ready="onMapReady"
      />
      <p class="mt-4 text-center text-sm text-slate-400">
        Displaying {{ fieldTasksWithValidLocation.length }} field tasks on map.
      </p>
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
} from 'leaflet';

interface Props {
  tasks: ITask[];
}
const props = defineProps<Props>();

// Get the Leaflet library ref from our composable
const { leaflet: L } = useLeaflet();

const fieldTasks = computed(() => {
  return props.tasks.filter((task) => task.taskType === TaskType.Field);
});

const fieldTasksWithValidLocation = computed(() => {
  return fieldTasks.value.filter(
    (task) =>
      task.location?.type === 'Point' &&
      Array.isArray(task.location.coordinates) &&
      task.location.coordinates.length === 2
  );
});

const mapInstance = ref<LeafletMapInstance | null>(null);
// A layer group to hold all our markers, making them easy to clear and manage
const markerLayer = ref<LayerGroup | null>(null);
const initialMapZoom = 2;
const initialMapCenter = ref<LatLngExpression>([20, 0]);

// This function runs when the base map component tells us it's ready
const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  // Initialize the marker layer and add it to the map
  if (L.value) {
    markerLayer.value = L.value.layerGroup().addTo(map);
  }
};

// This is the core reactive logic.
// It watches for changes in the task list or when the Leaflet library loads.
watch(
  [fieldTasksWithValidLocation, L],
  ([tasks, leafletInstance]) => {
    // Exit if the map, marker layer, or Leaflet library aren't ready yet
    if (!mapInstance.value || !markerLayer.value || !leafletInstance) {
      return;
    }

    // 1. Clear all existing markers from the layer
    markerLayer.value.clearLayers();

    if (tasks.length === 0) {
      // If no tasks, reset the map to the default global view
      mapInstance.value.setView(initialMapCenter.value, initialMapZoom);
      return;
    }

    // 2. Create and add new markers for each task
    const latLngs: LatLngExpression[] = [];
    tasks.forEach((task) => {
      const coords = task.location!.coordinates;
      const latLng: LatLngExpression = [coords[1], coords[0]]; // [lat, lng]
      latLngs.push(latLng);

      // Build the popup content as an HTML string
      const popupContent = `
        <h3 class="font-bold text-slate-800">${task.title}</h3>
        <p class="text-sm text-slate-700">${task.description || ''}</p>
        <p class="text-xs text-slate-600">Status: ${task.status}</p>
        <p class="text-xs text-slate-600">Due: ${formatDate(task.dueDate)}</p>
        ${
          task.project
            ? `<p class="text-xs text-slate-600 font-semibold">Project: ${task.project.name}</p>`
            : ''
        }
        <a href="/dashboard/tasks/${
          task.id
        }" class="text-emerald-500 hover:underline text-sm mt-2 block">View Details</a>
      `;

      leafletInstance.marker(latLng).addTo(markerLayer.value).bindPopup(popupContent);
    });

    // 3. Adjust the map view to fit all the new markers
    if (latLngs.length > 0) {
      const bounds = leafletInstance.latLngBounds(latLngs);
      if (bounds.isValid()) {
        mapInstance.value.fitBounds(bounds, {
          padding: [50, 50], // [x, y] padding in pixels
          maxZoom: 14, // Don't zoom in too closely
        });
      }
    }
  },
  { deep: true }
);

const formatDate = (dateString?: string) =>
  dateString
    ? new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';
</script>