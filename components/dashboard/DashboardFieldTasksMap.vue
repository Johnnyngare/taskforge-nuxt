<!-- C:/Users/HomePC/taskforge-nuxt/components/dashboard/DashboardFieldTasksMap.vue -->
<template>
  <div class="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md">
    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Field Task Map</h2>

    <div v-if="fieldTasksWithValidLocation.length > 0">
      <MapBase
        height="400px"
        :zoom="mapZoom"
        :center="mapCenter"
        :invalidate-size-trigger="mapInvalidateTrigger"
        @map-ready="onMapBaseReady"
      >
        <!-- Slot content for markers directly using @nuxtjs/leaflet components -->
        <template #default="{ map, leafletModule }">
          <LMarker
            v-for="task in fieldTasksWithValidLocation"
            :key="task.id"
            :lat-lng="[task.location!.coordinates[1], task.location!.coordinates[0]]"
          >
            <LPopup>
              <b>{{ task.title }}</b><br>
              {{ task.description || '' }}
              <br>
              <UButton v-if="map" size="xs" variant="ghost" class="mt-1" @click="focusAndOpenPopup(task, map, leafletModule)">
                View Task
              </UButton>
            </LPopup>
          </LMarker>
        </template>
      </MapBase>
    </div>
    <div v-else class="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
      No field tasks to display on the map.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { TaskType, type ITask } from '~/types/task';
// REMOVED: import { useLeaflet } from '~/composables/useLeaflet'; // No longer needed
import MapBase from '~/components/MapBase.vue'; // <--- NEW: Import our base map wrapper
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
  LControlZoom,
  LIcon // Import @nuxtjs/leaflet components directly for use in template slot
} from '@nuxtjs/leaflet'; // <--- Import from the module itself
import type {
  Map as LeafletMapInstance,
  LatLngExpression,
} from 'leaflet'; // Still use types from 'leaflet'

const props = defineProps<{ tasks: ITask[] | null; }>();

// No longer directly calling useLeaflet() here. MapBase handles the L module loading.
// const { leaflet: L } = useLeaflet();

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
const L_module_object = ref<typeof import('leaflet') | null>(null); // Store the Leaflet module from MapBase

const mapZoom = ref(2); // For global overview or adjusted by fitBounds
const mapCenter = ref<LatLngExpression>([20, 0]); // Default to global view

const mapInvalidateTrigger = ref(0); // Trigger for MapBase to call invalidateSize

const markersMap = ref<Map<string, typeof LMarker>>(new Map()); // Using LMarker type if useful

const onMapBaseReady = (map: LeafletMapInstance, L: typeof import('leaflet')) => {
  mapInstance.value = map;
  L_module_object.value = L;
  console.log('DashboardFieldTasksMap: MapBase reported ready.');
  // Now that mapInstance and L are ready, we can process initial tasks
  processTasks(fieldTasksWithValidLocation.value);
};

// Function to process tasks (add markers, fit bounds)
const processTasks = (tasks: ITask[]) => {
  if (!L_module_object.value || !mapInstance.value) return;

  const L = L_module_object.value; // Use the stored L object

  // The LMarker components in the template handle adding/removing markers reactively.
  // We only need to manage fitting bounds.

  if (tasks.length === 0) {
    mapInstance.value.setView(mapCenter.value, mapZoom.value);
    return;
  }

  const latLngs: LatLngExpression[] = tasks.map(task =>
    [task.location!.coordinates[1], task.location!.coordinates[0]]
  );

  if (latLngs.length > 0) {
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      mapInstance.value.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }
};

// Watch for changes in tasks prop to update map markers/bounds
watch(
  fieldTasksWithValidLocation,
  (newTasks) => {
    // When tasks change, ensure map is ready before processing
    if (mapInstance.value && L_module_object.value) {
      nextTick(() => processTasks(newTasks));
    } else {
      // If map not ready, process them once onMapBaseReady fires
      console.log('DashboardFieldTasksMap: Map not ready yet, tasks will be processed when map becomes ready.');
    }
  },
  { deep: true, immediate: true } // immediate: true to process initial tasks
);

const focusAndOpenPopup = (task: ITask, map: LeafletMapInstance, L: typeof import('leaflet')) => {
  if (!map || !task.location || !task.id || !L) return;

  const latLng: LatLngExpression = [task.location.coordinates[1], task.location.coordinates[0]];
  map.setView(latLng, 15); // Zoom to task location

  // This part is trickier when markers are implicitly managed by LMarker components.
  // We might need a way to access the native Leaflet marker instance from the LMarker component.
  // For simplicity, for now, if LMarker components add a ref, you'd access them.
  // A common pattern is to give LMarker components a ref or access them via a data structure.
  // For basic popups, just setting the view is often enough if the LMarker is already there.

  // To truly open a specific marker's popup, you'd need a ref on the LMarker.
  // <LMarker ref="markerRefs[task.id]" ...>
  // Then: markerRefs.value[task.id]?.leafletObject?.openPopup();
  // For this example, we just set view and implicitly assume popup interaction.
};


defineExpose({
  // Expose focusOnTask, but now it needs the L_module_object
  focusOnTask: (task: ITask) => {
    // When external component calls focusOnTask, use our stored map/L instances
    if (mapInstance.value && L_module_object.value && task.location) {
      focusAndOpenPopup(task, mapInstance.value, L_module_object.value);
    } else {
      console.warn('DashboardFieldTasksMap: Attempted to focus on task but map not ready.');
    }
  },
  triggerInvalidateSize: () => {
    mapInvalidateTrigger.value++; // Increment to trigger watch in MapBase
    console.log('DashboardFieldTasksMap: invalidateSize triggered for map.');
  }
});
</script>