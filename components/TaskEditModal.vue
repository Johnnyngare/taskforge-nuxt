<!-- components/TaskEditModal.vue - UPDATED with Save button -->
<template>
  <UModal :model-value="modelValue" :prevent-close="submitting" @close="handleCancel">
    <UCard
      class="shadow-sm"
      :ui="{
        background: 'bg-slate-800 dark:bg-slate-900',
        ring: 'ring-1 ring-slate-600 dark:ring-slate-700',
        divide: 'divide-y divide-slate-700',
      }"
      @keydown.esc="handleCancel"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Task: {{ form.title || 'Untitled' }}
          </h3>
          <UButton
            icon="i-heroicons-x-mark-20-solid"
            color="gray"
            variant="ghost"
            @click="handleCancel"
            :disabled="submitting"
            aria-label="Close"
          />
        </div>
      </template>

      <UForm
        id="edit-task-form"
        :state="form"
        @submit.prevent="submitEdit"
        class="space-y-4"
      >
        <UFormGroup
          label="Task Title"
          for="edit-title"
          required
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <UInput
            id="edit-title"
            v-model="form.title"
            placeholder="What needs to be done?"
            required
            :disabled="submitting"
          />
        </UFormGroup>

        <UFormGroup
          label="Description (optional)"
          for="edit-description"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <UTextarea
            id="edit-description"
            v-model="form.description"
            placeholder="Add more details about this task..."
            :rows="2"
            :disabled="submitting"
          />
        </UFormGroup>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormGroup
            label="Priority"
            for="edit-priority"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            <USelect
              id="edit-priority"
              v-model="form.priority"
              :options="Object.values(TaskPriorityEnum)"
              :disabled="submitting"
            />
          </UFormGroup>
          <UFormGroup
            label="Due Date"
            for="edit-due-date"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            <UInput
              id="edit-due-date"
              v-model="form.dueDate"
              type="date"
              :disabled="submitting"
              :min="today"
              placeholder="mm/dd/yyyy"
            />
          </UFormGroup>
        </div>

        <!-- Assign to Field Officer(s) Dropdown -->
        <UFormGroup
          label="Assign to Field Officer(s) (optional)"
          for="edit-assignedTo"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <USelect
            id="edit-assignedTo"
            v-model="form.assignedTo"
            :options="fieldOfficerOptions"
            option-attribute="label"
            value-attribute="value"
            :disabled="submitting || fieldOfficersPending"
            multiple
            placeholder="Select Field Officer(s)"
          />
          <p v-if="fieldOfficersError" class="mt-1 text-xs text-red-400">
            Error loading field officers: {{ fieldOfficersError.message }}
          </p>
        </UFormGroup>

        <!-- Project Selector -->
        <UFormGroup
          label="Assign to Project (optional)"
          for="edit-project"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <USelect
            id="edit-project"
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
          for="edit-cost"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <UInput
            id="edit-cost"
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
          for="edit-task-type"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <USelect
            id="edit-task-type"
            v-model="form.taskType"
            :options="Object.values(TaskTypeEnum)"
            :disabled="submitting"
          />
        </UFormGroup>

        <!-- Map Picker for Field Tasks -->
        <div v-if="form.taskType === TaskTypeEnum.Field">
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
            @click="handleCancel"
            class="w-full sm:w-auto"
            variant="ghost"
            :disabled="submitting"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            form="edit-task-form"
            class="w-full sm:w-auto"
            :disabled="submitting || !form.title.trim()"
            :loading="submitting"
            icon="i-heroicons-check"
          >
            Save Changes
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useProjects } from '~/composables/useProjects';
import { useTasks } from '~/composables/useTasks'; // To fetch field officers
import { useAppToast } from '~/composables/useAppToast';
import MapBase from '~/components/MapBase.vue';
import {
  TaskPriority,
  TaskStatus, // Only needed if setting a default status, but not for updates
  TaskType,
  type ITask,
  type GeoJSONPoint,
} from '~/types/task';
import type { IUser } from '~/types/user';
import type {
  Map as LeafletMapInstance,
  LatLngExpression,
  LeafletMouseEvent,
} from 'leaflet';

// Props: task (ITask to edit), modelValue (for v-model control of modal visibility)
const props = defineProps<{
  task: ITask | null;
  modelValue: boolean; // For v-model control
}>();

// Emits: update:modelValue (to close modal), save (on successful form submission), cancel (on close/cancel)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void; // Standard for v-model
  (e: 'save', taskId: string, updatedData: Partial<ITask>): void;
  (e: 'cancel'): void; // For explicit cancel action
}>();

const toast = useAppToast();
const {
  projects,
  pending: projectsPending,
  error: projectsError,
} = useProjects();
const {
  fieldOfficers,
  pending: fieldOfficersPending,
  error: fieldOfficersError,
} = useTasks(); // Assuming useTasks provides fieldOfficers

const submitting = ref(false);
const isMapReady = ref(false);
const mapBaseRef = ref<InstanceType<typeof MapBase> | null>(null);
const mapInstance = ref<LeafletMapInstance | null>(null);
const L = ref<typeof import('leaflet') | null>(null);

// Internal form state interface, matching editable fields
interface TaskFormState {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null; // Stored as 'YYYY-MM-DD' string for input type="date"
  projectId: string | null; // Stores Project ID as string
  assignedTo: string[]; // Stores array of User IDs as strings
  cost: number | null;
  taskType: TaskType;
  location?: GeoJSONPoint | null;
}

const defaultFormState = (): TaskFormState => ({
  title: '',
  description: null,
  priority: TaskPriority.Medium,
  dueDate: null,
  projectId: null,
  assignedTo: [],
  cost: null,
  taskType: TaskType.Office,
  location: null,
});

const form = ref<TaskFormState>(defaultFormState());

// Watch the 'task' prop to initialize or reset the form whenever the task prop changes
watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      form.value = {
        title: newTask.title || '',
        description: newTask.description || null,
        priority: newTask.priority || TaskPriority.Medium,
        // Convert ISO date string to 'YYYY-MM-DD' for HTML date input
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : null,
        // Ensure projectId is a string ID or null
        projectId: newTask.projectId
          ? (typeof newTask.projectId === 'object' ? newTask.projectId.id : newTask.projectId)
          : null,
        // Ensure assignedTo is an array of string IDs
        assignedTo: newTask.assignedTo
          ? newTask.assignedTo.map(u => typeof u === 'object' ? u.id : String(u))
          : [],
        cost: newTask.cost ?? null, // Use nullish coalescing to handle 0 as a valid cost
        taskType: newTask.taskType || TaskType.Office,
        location: newTask.location || null,
      };
      // Reset map state to ensure it re-renders if task type is Field
      if (newTask.taskType === TaskType.Field && newTask.location) {
        mapCenter.value = [newTask.location.coordinates[1], newTask.location.coordinates[0]];
        mapZoom.value = 13; // Set a default zoom level for existing locations
        nextTick(() => { mapInvalidateTrigger.value++; });
      }
    } else {
      form.value = defaultFormState(); // Reset to default if no task is provided
    }
  },
  { immediate: true, deep: true } // Run immediately on mount and deep watch for nested changes (though not strictly necessary for simple prop change)
);

// Computed property for today's date (for min attribute of date input)
const today = computed(() => new Date().toISOString().split('T')[0]);

// Options for Project dropdown
const projectOptions = computed(() =>
  projects.value?.map((p) => ({ label: p.name, value: p.id })) || []
);

// Options for Field Officer dropdown (for multiple select)
const fieldOfficerOptions = computed(() => {
  const options = fieldOfficers.value?.map((fo: IUser) => ({ label: fo.name, value: fo.id })) || [];
  // 'Unassigned' option maps to an empty array for a multiple select v-model
  return [{ label: 'Unassigned', value: [] }, ...options];
});


// Map configuration and functions
const mapZoom = ref(10);
const mapCenter = ref<LatLngExpression>([0.0, 38.0]); // Default to Nairobi region or similar
const mapInvalidateTrigger = ref(0);

const onMapReady = (
  map: LeafletMapInstance,
  leafletModule: typeof import('leaflet')
) => {
  mapInstance.value = map;
  L.value = leafletModule;
  isMapReady.value = true;
  map.on('click', handleMapClick);

  // If a task with a location is provided, center the map on it
  if (form.value.taskType === TaskType.Field && form.value.location) {
    mapCenter.value = [form.value.location.coordinates[1], form.value.location.coordinates[0]];
    mapZoom.value = 13; // Zoom in a bit more
  } else if (process.client && navigator?.geolocation) {
    // Attempt to get user's current location if no task location
    navigator.geolocation.getCurrentPosition(
      (pos) => { mapCenter.value = [pos.coords.latitude, pos.coords.longitude]; },
      (error) => { console.warn('Geolocation error (using default map center):', error.message); },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }
};

const handleMapClick = (e: LeafletMouseEvent) => {
  if (!isMapReady.value || !mapInstance.value || !L.value) {
    console.warn('TaskEditModal: Map click ignored - map not ready');
    return;
  }
  const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
  form.value.location = { type: 'Point', coordinates: coords };
};

// Watch taskType to clear location if switched to Office
watch(
  () => form.value.taskType,
  (newType) => {
    if (newType === TaskType.Office) {
      form.value.location = null;
    } else if (newType === TaskType.Field) {
      nextTick(() => { mapInvalidateTrigger.value++; }); // Trigger map resize/re-render
    }
  }
);

onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.off('click', handleMapClick);
  }
});

// Function to handle form submission (Save button)
const submitEdit = async () => {
  if (!props.task || !form.value.title.trim() || submitting.value) {
    if (!form.value.title.trim()) {
      toast.add({
        title: 'Validation Error',
        description: 'Task Title cannot be empty.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
    }
    return;
  }

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
    const updatedData: Partial<ITask> = {
      title: form.value.title.trim(),
      // Ensure empty strings become null for optional fields matching backend schema
      description: form.value.description?.trim() || null,
      priority: form.value.priority,
      // Convert 'YYYY-MM-DD' string to ISO string for backend, or null
      dueDate: form.value.dueDate ? new Date(`${form.value.dueDate}T00:00:00Z`).toISOString() : null,
      projectId: form.value.projectId || null,
      assignedTo: form.value.assignedTo, // Already string[]
      cost: form.value.cost ?? null,
      taskType: form.value.taskType,
      location: form.value.location || null, // Ensure null for no location
    };

    // Emit the 'save' event to the parent component with taskId and updated data
    emit('save', props.task.id, updatedData);
    // The parent is expected to close the modal and refresh the data
  } catch (error: any) {
    // Parent's handleSaveEdit should catch and toast specific API errors
    console.error("TaskEditModal: Error during form submission process:", error);
    toast.add({
      title: 'Form Submission Error',
      description: error.message || 'An unexpected error occurred during saving.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    submitting.value = false;
  }
};

// Function to handle Cancel button or modal close (X mark / ESC key)
const handleCancel = () => {
  emit('cancel'); // Notify parent of cancellation
  emit('update:modelValue', false); // Close the modal
};

// Expose enums to template
const TaskTypeEnum = TaskType;
const TaskPriorityEnum = TaskPriority;
</script>

<style scoped>
/* Add any specific styles for the modal if needed */
</style>