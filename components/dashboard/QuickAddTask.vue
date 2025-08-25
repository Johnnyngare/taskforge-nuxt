<!-- C:/Users/HomePC/taskforge-nuxt/components/dashboard/QuickAddTask.vue -->
<template>
  <UCard
    class="shadow-sm"
    :ui="{
      background: 'bg-slate-800 dark:bg-slate-900',
      ring: 'ring-1 ring-slate-600 dark:ring-slate-700',
      divide: 'divide-y divide-slate-700',
    }"
    @keydown.esc="$emit('close')"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Add Task
        </h3>
        <UButton
          icon="i-heroicons-x-mark-20-solid"
          color="gray"
          variant="ghost"
          @click="$emit('close')"
          :disabled="submitting"
          aria-label="Close"
        />
      </div>
    </template>

    <UForm :state="form" @submit.prevent="submitTask" class="space-y-4">
      <!-- ... (other form fields) ... -->

      <!-- Map Picker for Field Tasks -->
      <!-- The ClientOnly is now inside MapBase, but it's okay to keep one here for map section -->
      <ClientOnly fallback-tag="div" fallback="Loading map interface...">
        <div v-if="form.taskType === TaskType.Field">
          <label class="mb-1 block text-sm font-medium text-slate-300">
            Pick Location for Field Task
            <span class="text-xs text-slate-500"
              >(Click on map to place marker)</span
            >
          </label>
          <p v-if="form.location" class="mb-2 text-sm text-emerald-400">
            Selected: Lat {{ form.location.coordinates[1].toFixed(4) }}, Lng
            {{ form.location.coordinates[0].toFixed(4) }}
          </p>
          <!-- UPDATED: Use MapBase component -->
          <MapBase
            ref="quickAddTaskMapRef"
            height="300px"
            :zoom="initialMapZoom"
            :center="initialMapCenter"
            :invalidate-size-trigger="mapInvalidateTrigger"
            @map-ready="onMapBaseReadyForQuickAdd"
          >
            <template #default="{ map, leafletModule }">
              <!-- Render an LMarker if a location is selected -->
              <LMarker
                v-if="form.location"
                :lat-lng="[form.location.coordinates[1], form.location.coordinates[0]]"
              >
                <LPopup>Selected Location</LPopup>
              </LMarker>
            </template>
          </MapBase>
        </div>
      </ClientOnly>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            type="button"
            @click="$emit('close')"
            class="w-full sm:w-auto"
            variant="ghost"
            :disabled="submitting"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            class="w-full sm:w-auto"
            :disabled="submitting || !form.title.trim()"
            :loading="submitting"
            icon="i-heroicons-check"
          >
            Create Task
          </UButton>
        </div>
      </template>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useTasks } from '~/composables/useTasks';
import { useProjects } from '~/composables/useProjects';
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type ITask,
  type GeoJSONPoint,
} from '~/types/task';
import { useAppToast } from '~/composables/useAppToast';
// REMOVED: import UiLeafletMap from '~/components/ui/LeafletMap.vue'; // No longer needed
// REMOVED: import { useLeaflet } from '~/composables/useLeaflet'; // No longer needed
import MapBase from '~/components/MapBase.vue'; // <--- NEW: Import our base map wrapper
import { LMap, LTileLayer, LMarker, LPopup } from '@nuxtjs/leaflet'; // <--- Import module components
import type {
  Map as LeafletMapInstance,
  LatLngExpression,
  LeafletMouseEvent,
  Marker as LeafletMarker,
} from 'leaflet'; // Still use types from 'leaflet'

const { createTask } = useTasks();
const {
  projects,
  pending: projectsPending,
  error: projectsError,
} = useProjects();
const toast = useAppToast();
// L_object is now sourced from MapBase's onMapBaseReady
const L_object_from_mapbase = ref<typeof import('leaflet') | null>(null);
const quickAddTaskMapRef = ref<InstanceType<typeof MapBase> | null>(null); // Ref to MapBase

const emit = defineEmits<{
  (e: 'task-created'): void;
  (e: 'close'): void;
}>();

const submitting = ref(false);

interface QuickAddForm {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  projectId: string | null;
  cost?: number | null;
  taskType: TaskType;
  location?: GeoJSONPoint;
}

const form = ref<QuickAddForm>({
  title: '',
  description: '',
  priority: TaskPriority.Medium,
  dueDate: '',
  projectId: null,
  cost: null,
  taskType: TaskType.Office,
  location: undefined,
});

const today = computed(() => new Date().toISOString().split('T')[0]);

const projectOptions = computed(() =>
  projects.value.map((p) => ({ label: p.name, value: p.id }))
);

const mapInstance = ref<LeafletMapInstance | null>(null);
const locationMarker = ref<LeafletMarker | null>(null); // This marker will be managed manually for specific click events

const initialMapZoom = 10;
const initialMapCenter = ref<LatLngExpression>([0.0, 38.0]);

const mapInvalidateTrigger = ref(0); // Trigger for MapBase to call invalidateSize


// Handler for when MapBase emits 'map-ready'
const onMapBaseReadyForQuickAdd = (map: LeafletMapInstance, L_module: typeof import('leaflet')) => {
  mapInstance.value = map;
  L_object_from_mapbase.value = L_module;
  console.log('QuickAddTask.vue: MapBase reported ready.');

  // Attach click listener directly to the Leaflet map instance
  map.on('click', handleMapClick);

  // Geolocation logic
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatLng: LatLngExpression = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        map.setView(userLatLng, initialMapZoom);
        initialMapCenter.value = userLatLng;
      },
      (error) => {
        console.warn(`Geolocation error: ${error.message}. Using default map center.`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    console.warn('Geolocation is not supported by this browser.');
  }
};

const handleMapClick = (e: LeafletMouseEvent) => {
  if (!L_object_from_mapbase.value || !mapInstance.value) return;
  const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
  form.value.location = { type: 'Point', coordinates: coords };

  // Note: The LMarker in the template is reactive to form.location.
  // If you need a manual marker for click feedback, you'd add it here.
  // For now, rely on the template's LMarker.
};


// Watch for modal open state to trigger invalidateSize
watch(() => emit, (newVal) => { // Assuming emit changes when modal opens/closes or a prop indicating open
  if (quickAddTaskMapRef.value) {
    // This assumes the QuickAddTask component itself is conditionally rendered (e.g., in a UModal)
    // If QuickAddTask itself is rendered inside a UModal, and you open that UModal:
    // This `watch` should ideally listen to the modal's `model-value` prop directly.
    // As a placeholder, we'll increment a trigger.
    nextTick(() => {
      mapInvalidateTrigger.value++;
      console.log('QuickAddTask.vue: Triggering invalidateSize on map.');
    });
  }
}, { immediate: false }); // Immediate false: only trigger after it's definitely opened


onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.off('click', handleMapClick); // Clean up custom event listener
  }
});

watch(
  () => form.value.taskType,
  (newType) => {
    if (newType === TaskType.Office) {
      form.value.location = undefined;
      // No need to manually remove LMarker; it's handled by v-if="form.location"
    }
  }
);

const submitTask = async () => {
  if (!form.value.title.trim() || submitting.value) return;

  if (form.value.taskType === TaskType.Field && !form.value.location) {
    toast.add({
      title: 'Location Required',
      description: 'Please pick a location on the map for Field tasks.',
      color: 'red',
      icon: 'i-heroicons-map-pin',
    });
    return;
  }

  submitting.value = true;
  try {
    const taskData: Partial<ITask> = {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      priority: form.value.priority,
      status: TaskStatus.Pending,
      dueDate: form.value.dueDate
        ? new Date(`${form.value.dueDate}T00:00:00Z`).toISOString()
        : undefined,
      projectId: form.value.projectId || undefined,
      cost: form.value.cost != null ? form.value.cost : undefined,
      taskType: form.value.taskType,
      location: form.value.location,
    };

    await createTask(taskData);
    emit('task-created');
    toast.add({
      title: 'Task Created!',
      description: 'Your task has been added successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });

    // Reset form after successful creation
    form.value = {
      title: '',
      description: '',
      priority: TaskPriority.Medium,
      dueDate: '',
      projectId: null,
      cost: null,
      taskType: TaskType.Office,
      location: undefined,
    };
    // No need to manually remove LMarker; it's handled by v-if="form.location"
  } catch (error: any) {
    console.error('Error creating task:', error);
    const errorMessage = error.data?.message || 'An unexpected error occurred.';
    toast.add({
      title: 'Error Creating Task',
      description: `Failed to create task: ${errorMessage}`,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    submitting.value = false;
  }
};
</script>