//components/dashboard/QuickAddTask.vue
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

    <UForm
      id="quick-add-form"
      :state="form"
      @submit.prevent="submitTask"
      class="space-y-4"
    >
      <UFormGroup
        label="Task Title"
        for="quick-title"
        required
        class="mb-1 block text-sm font-medium text-slate-300"
      >
        <UInput
          id="quick-title"
          v-model="form.title"
          placeholder="What needs to be done?"
          required
          :disabled="submitting"
        />
      </UFormGroup>

      <UFormGroup
        label="Description (optional)"
        for="quick-description"
        class="mb-1 block text-sm font-medium text-slate-300"
      >
        <UTextarea
          id="quick-description"
          v-model="form.description"
          placeholder="Add more details about this task..."
          :rows="2"
          :disabled="submitting"
        />
      </UFormGroup>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormGroup
          label="Priority"
          for="quick-priority"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <USelect
            id="quick-priority"
            v-model="form.priority"
            :options="Object.values(TaskPriority)"
            :disabled="submitting"
          />
        </UFormGroup>
        <UFormGroup
          label="Due Date"
          for="quick-due-date"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <UInput
            id="quick-due-date"
            v-model="form.dueDate"
            type="date"
            :disabled="submitting"
            :min="today"
          />
        </UFormGroup>
      </div>

      <!-- Project Selector -->
      <UFormGroup
        label="Assign to Project (optional)"
        for="quick-project"
        class="mb-1 block text-sm font-medium text-slate-300"
      >
        <USelect
          id="quick-project"
          v-model="form.projectId"
          :options="[{ label: 'No Project', value: null }, ...projectOptions]"
          option-attribute="label"
          value-attribute="value"
          :disabled="submitting || projectsPending"
        />
        <p v-if="projectsError" class="mt-1 text-xs text-red-400">
          Error loading projects: {{ projectsError.message }}
        </p>
      </UFormGroup>

      <!-- Cost Input -->
      <UFormGroup
        label="Cost (Optional)"
        for="quick-cost"
        class="mb-1 block text-sm font-medium text-slate-300"
      >
        <UInput
          id="quick-cost"
          v-model.number="form.cost"
          type="number"
          placeholder="e.g., 50.00"
          :disabled="submitting"
          step="0.01"
        />
      </UFormGroup>

      <!-- Task Type Selector (Office/Field) -->
      <UFormGroup
        label="Task Type"
        for="task-type"
        class="mb-1 block text-sm font-medium text-slate-300"
      >
        <USelect
          id="task-type"
          v-model="form.taskType"
          :options="Object.values(TaskType)"
          :disabled="submitting"
        />
      </UFormGroup>

      <!-- Map Picker for Field Tasks -->
      <div v-if="form.taskType === TaskType.Field">
        <label class="mb-1 block text-sm font-medium text-slate-300">
          Pick Location for Field Task
          <span class="text-xs text-slate-500"
            >(Click on map to place marker)</span
          >
        </label>

        <!-- Location Status Display -->
        <div class="mb-2 flex items-center gap-2">
          <div class="flex items-center gap-1">
            <div
              :class="isMapReady ? 'bg-green-500' : 'bg-yellow-500'"
              class="h-2 w-2 rounded-full"
            ></div>
            <span class="text-xs text-slate-400">
              Map: {{ isMapReady ? 'Ready' : 'Loading...' }}
            </span>
          </div>

          <p v-if="form.location" class="text-sm text-emerald-400">
            Selected: Lat {{ form.location.coordinates[1].toFixed(4) }}, Lng
            {{ form.location.coordinates[0].toFixed(4) }}
          </p>
          <span v-else class="text-xs text-slate-500"
            >No location selected</span
          >
        </div>

        <!-- Map Component -->
        <MapBase
          ref="mapBaseRef"
          height="300px"
          :zoom="mapZoom"
          :center="mapCenter"
          :invalidate-size-trigger="mapInvalidateTrigger"
          @map-ready="onMapReady"
        >
          <template #default="{ map, leafletModule }">
            <LMarker
              v-if="form.location && isMapReady"
              :lat-lng="[
                form.location.coordinates[1],
                form.location.coordinates[0],
              ]"
            >
              <LPopup>Selected Location</LPopup>
            </LMarker>
          </template>
        </MapBase>
      </div>
    </UForm>

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
          form="quick-add-form"
          class="w-full sm:w-auto"
          :disabled="submitting || !form.title.trim()"
          :loading="submitting"
          icon="i-heroicons-check"
        >
          Create Task
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
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
import MapBase from '~/components/MapBase.vue';

import type {
  Map as LeafletMapInstance,
  LatLngExpression,
  LeafletMouseEvent,
} from 'leaflet';

const { createTask } = useTasks();
const {
  projects,
  pending: projectsPending,
  error: projectsError,
} = useProjects();
const toast = useAppToast();

const emit = defineEmits<{
  (e: 'task-created'): void;
  (e: 'close'): void;
}>();

const submitting = ref(false);
const isMapReady = ref(false);
const mapBaseRef = ref<InstanceType<typeof MapBase> | null>(null);
const mapInstance = ref<LeafletMapInstance | null>(null);
const L = ref<typeof import('leaflet') | null>(null);

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

// Map configuration
const mapZoom = ref(10);
const mapCenter = ref<LatLngExpression>([0.0, 38.0]);
const mapInvalidateTrigger = ref(0);

const onMapReady = (
  map: LeafletMapInstance,
  leafletModule: typeof import('leaflet')
) => {
  console.log('QuickAddTask: Map ready');
  mapInstance.value = map;
  L.value = leafletModule;
  isMapReady.value = true;

  // Attach click handler when map is ready
  map.on('click', handleMapClick);
  console.log('QuickAddTask: Click handler attached to map');
};

const handleMapClick = (e: LeafletMouseEvent) => {
  if (!isMapReady.value || !mapInstance.value || !L.value) {
    console.warn('QuickAddTask: Map click ignored - map not ready');
    return;
  }

  const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
  form.value.location = { type: 'Point', coordinates: coords };

  console.log('QuickAddTask: Location selected:', coords);
};

onMounted(() => {
  console.log('QuickAddTask: Component mounted, client-side:', process.client);

  // Try to get user location for better UX
  if (process.client && navigator?.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log(
          'QuickAddTask: Got user location:',
          pos.coords.latitude,
          pos.coords.longitude
        );
        mapCenter.value = [pos.coords.latitude, pos.coords.longitude];
      },
      (error) => {
        console.log(
          'QuickAddTask: Geolocation error (using default center):',
          error.message
        );
      }
    );
  }
});

// Watch for task type changes
watch(
  () => form.value.taskType,
  (newType, oldType) => {
    console.log('QuickAddTask: Task type changed from', oldType, 'to', newType);

    if (newType === TaskType.Office) {
      form.value.location = undefined;
      console.log('QuickAddTask: Cleared location for Office task');
    } else if (newType === TaskType.Field) {
      // Trigger map size invalidation when switching to Field task
      nextTick(() => {
        mapInvalidateTrigger.value++;
        console.log(
          'QuickAddTask: Triggered map invalidation after switching to Field task'
        );
      });
    }
  }
);

onBeforeUnmount(() => {
  console.log('QuickAddTask: Component unmounting');

  if (mapInstance.value) {
    mapInstance.value.off('click', handleMapClick);
    console.log('QuickAddTask: Click handler removed');
  }
});

const submitTask = async () => {
  if (!form.value.title.trim() || submitting.value) {
    console.warn('QuickAddTask: Submit blocked - invalid form state');
    return;
  }

  if (form.value.taskType === TaskType.Field && !form.value.location) {
    console.warn('QuickAddTask: Submit blocked - Field task without location');
    toast.add({
      title: 'Location Required',
      description: 'Please pick a location on the map for Field tasks.',
      color: 'red',
      icon: 'i-heroicons-map-pin',
    });
    return;
  }

  submitting.value = true;
  console.log('QuickAddTask: Submitting task:', {
    title: form.value.title,
    taskType: form.value.taskType,
    hasLocation: !!form.value.location,
  });

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

    console.log('QuickAddTask: Task created successfully');
    toast.add({
      title: 'Task Created!',
      description: 'Your task has been added successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });

    // Reset form
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
  } catch (error: any) {
    console.error('QuickAddTask: Error creating task:', error);
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