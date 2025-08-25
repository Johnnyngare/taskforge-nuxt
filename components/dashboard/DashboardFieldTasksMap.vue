<!-- components/dashboard/DashboardFieldTasksMap.vue -->
<template>
  <div class="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md">
    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Field Task Map</h2>

    <div v-if="fieldTasksWithValidLocation.length > 0">
      <MapBase
        ref="mapBaseRef"
        height="400px"
        :zoom="mapZoom"
        :center="mapCenter"
        :invalidate-size-trigger="mapInvalidateTrigger"
        @map-ready="onMapBaseReady"
      >
        <template #default="{ map, leafletModule }">
          <LMarker
            v-for="task in fieldTasksWithValidLocation"
            :key="task.id"
            :lat-lng="[task.location!.coordinates[1], task.location!.coordinates[0]]"
          >
            <LPopup>
              <b>{{ task.title }}</b><br />
              {{ task.description || '' }}
              <br />
              <UButton
                v-if="map && leafletModule"
                size="xs"
                variant="ghost"
                class="mt-1"
                @click="focusAndOpen(task, map)"
              >
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
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { TaskType, type ITask } from '~/types/task';
import MapBase from '~/components/MapBase.vue';
import type { Map as LeafletMapInstance, LatLngExpression } from 'leaflet';

const props = defineProps<{ tasks: ITask[] | null }>();

const mapBaseRef = ref<InstanceType<typeof MapBase> | null>(null);

const fieldTasksWithValidLocation = computed(() => {
  if (!Array.isArray(props.tasks)) return [];
  return props.tasks.filter(
    (task) =>
      task.taskType === TaskType.Field &&
      task.location?.type === 'Point' &&
      Array.isArray(task.location.coordinates) &&
      task.location.coordinates.length === 2 &&
      typeof task.location.coordinates[0] === 'number' &&
      typeof task.location.coordinates[1] === 'number' &&
      !isNaN(task.location.coordinates[0]) &&
      !isNaN(task.location.coordinates[1]) &&
      task.location.coordinates[1] >= -90 && task.location.coordinates[1] <= 90 &&
      task.location.coordinates[0] >= -180 && task.location.coordinates[0] <= 180
  );
});

const mapInstance = ref<LeafletMapInstance | null>(null);
const L_module_object = ref<typeof import('leaflet') | null>(null);
const isMapReady = ref(false);

const mapZoom = ref(2);
const mapCenter = ref<LatLngExpression>([20, 0]);
const mapInvalidateTrigger = ref(0);

// Store initial tasks to process once map is ready
const pendingTasksToProcess = ref<ITask[]>([]);

function onMapBaseReady(map: LeafletMapInstance, L_module: typeof import('leaflet')) {
  console.log('DashboardFieldTasksMap: MapBase ready event received');
  
  mapInstance.value = map;
  L_module_object.value = L_module;
  isMapReady.value = true;
  
  // Process any pending tasks
  if (pendingTasksToProcess.value.length > 0) {
    console.log('DashboardFieldTasksMap: Processing pending tasks:', pendingTasksToProcess.value.length);
    processTasks(pendingTasksToProcess.value);
    pendingTasksToProcess.value = [];
  }
  
  // Process current tasks
  processTasks(fieldTasksWithValidLocation.value);
  
  // Now we can safely watch for task changes
  setupTaskWatcher();
}

let taskWatcherStop: (() => void) | null = null;

function setupTaskWatcher() {
  // Ensure we only set up the watcher once
  if (taskWatcherStop) {
    console.log('DashboardFieldTasksMap: Task watcher already set up');
    return;
  }

  console.log('DashboardFieldTasksMap: Setting up task watcher');
  
  taskWatcherStop = watch(
    fieldTasksWithValidLocation,
    (newTasks, oldTasks) => {
      console.log('DashboardFieldTasksMap: Tasks changed:', { 
        newCount: newTasks.length, 
        oldCount: oldTasks?.length || 0,
        mapReady: isMapReady.value 
      });
      
      if (isMapReady.value) {
        nextTick(() => processTasks(newTasks));
      } else {
        console.log('DashboardFieldTasksMap: Map not ready, storing tasks for later processing');
        pendingTasksToProcess.value = [...newTasks];
      }
    },
    { deep: true }
  );
}

function processTasks(tasks: ITask[]) {
  if (!isMapReady.value || !L_module_object.value || !mapInstance.value) {
    console.warn('DashboardFieldTasksMap: processTasks called but map not ready', {
      mapReady: isMapReady.value,
      hasL: !!L_module_object.value,
      hasMap: !!mapInstance.value
    });
    
    // Store tasks for processing when map becomes ready
    pendingTasksToProcess.value = [...tasks];
    return;
  }

  const L_val = L_module_object.value;
  console.log('DashboardFieldTasksMap: Processing tasks:', tasks.length);

  if (!tasks.length) {
    mapInstance.value.setView(mapCenter.value, mapZoom.value);
    return;
  }

  try {
    // Validate coordinates before creating bounds
    const validLatLngs: LatLngExpression[] = [];
    
    for (const task of tasks) {
      if (task.location?.coordinates) {
        const [lng, lat] = task.location.coordinates;
        
        // Additional validation
        if (
          typeof lat === 'number' && typeof lng === 'number' &&
          !isNaN(lat) && !isNaN(lng) &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180
        ) {
          validLatLngs.push([lat, lng]);
        } else {
          console.warn('DashboardFieldTasksMap: Invalid coordinates for task:', task.title, { lat, lng });
        }
      }
    }

    if (validLatLngs.length === 0) {
      console.warn('DashboardFieldTasksMap: No valid coordinates found');
      mapInstance.value.setView(mapCenter.value, mapZoom.value);
      return;
    }

    console.log('DashboardFieldTasksMap: Creating bounds with', validLatLngs.length, 'valid coordinates');

    if (validLatLngs.length === 1) {
      // Single point - just center on it
      mapInstance.value.setView(validLatLngs[0], 14);
    } else {
      // Multiple points - fit bounds
      const bounds = L_val.latLngBounds(validLatLngs);
      
      if (bounds.isValid()) {
        console.log('DashboardFieldTasksMap: Fitting bounds for', validLatLngs.length, 'locations');
        mapInstance.value.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 14,
          animate: true
        });
      } else {
        console.warn('DashboardFieldTasksMap: Created bounds are not valid');
        // Fallback to center on first valid coordinate
        mapInstance.value.setView(validLatLngs[0], 10);
      }
    }
  } catch (error) {
    console.error('DashboardFieldTasksMap: Error processing tasks:', error);
    // Fallback to default view
    mapInstance.value.setView(mapCenter.value, mapZoom.value);
  }
}

function focusAndOpen(task: ITask, map: LeafletMapInstance) {
  if (!map || !task.location) {
    console.warn('DashboardFieldTasksMap: focusAndOpen called with invalid params');
    return;
  }
  
  const [lng, lat] = task.location.coordinates;
  
  // Validate coordinates
  if (
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  ) {
    const latLng: LatLngExpression = [lat, lng];
    console.log('DashboardFieldTasksMap: Focusing on task:', task.title, 'at', latLng);
    map.setView(latLng, 15);
  } else {
    console.warn('DashboardFieldTasksMap: Invalid coordinates for focus:', { lat, lng });
  }
}

// Cleanup watcher on unmount
onBeforeUnmount(() => {
  if (taskWatcherStop) {
    taskWatcherStop();
    console.log('DashboardFieldTasksMap: Task watcher cleaned up');
  }
});

defineExpose({
  focusOnTask(task: ITask) {
    if (isMapReady.value && mapInstance.value && task.location) {
      focusAndOpen(task, mapInstance.value);
    } else {
      console.warn('DashboardFieldTasksMap: focusOnTask called before map ready or invalid task');
    }
  },
  triggerInvalidateSize() {
    mapBaseRef.value?.triggerInvalidateSize();
    console.log('DashboardFieldTasksMap: invalidateSize triggered via ref.');
  },
});
</script>