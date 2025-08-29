<template>
  <UModal v-model="isModalOpen" :prevent-close="submitting" @update:model-value="$emit('cancel')">
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        background: 'bg-slate-800 dark:bg-slate-900',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Task
          </h3>
          <UButton
            icon="i-heroicons-x-mark-20-solid"
            color="gray"
            variant="ghost"
            @click="$emit('cancel')"
            :disabled="submitting"
            aria-label="Close"
          />
        </div>
      </template>

      <UForm :state="editForm" @submit.prevent="saveChanges" class="space-y-4">
        <UFormGroup
          label="Task Title"
          for="edit-title"
          required
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <UInput
            id="edit-title"
            v-model="editForm.title"
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
            v-model="editForm.description"
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
              v-model="editForm.priority"
              :options="Object.values(TaskPriority)"
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
              v-model="editForm.dueDate"
              type="date"
              :disabled="submitting"
              :min="today"
            />
          </UFormGroup>
        </div>

        <!-- NEW: Assign to Field Officer Dropdown -->
        <UFormGroup
          label="Assign to Field Officer(s) (optional)"
          for="edit-assignedTo"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          <USelect
            id="edit-assignedTo"
            v-model="editForm.assignedTo"
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
            v-model="editForm.projectId"
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
            v-model.number="editForm.cost"
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
            v-model="editForm.taskType"
            :options="Object.values(TaskType)"
            :disabled="submitting"
          />
        </UFormGroup>

        <!-- Map Picker for Field Tasks -->
        <ClientOnly fallback-tag="div" fallback="Loading map interface...">
          <div v-if="editForm.taskType === TaskType.Field">
            <label class="mb-1 block text-sm font-medium text-slate-300">
              Pick/Drag Location for Field Task
              <span class="text-xs text-slate-500"
                >(Click map or drag marker)</span
              >
            </label>
            <p v-if="selectedCoordinates" class="mb-2 text-sm text-emerald-400">
              Selected: Lat {{ selectedCoordinates[1].toFixed(4) }}, Lng
              {{ selectedCoordinates[0].toFixed(4) }}
            </p>
            <div class="map-container-wrapper" style="height: 300px; width: 100%;">
              <LMap
                ref="mapRef"
                :zoom="initialMapZoom"
                :center="initialMapCenter"
                @ready="onMapReady"
              >
                <LTileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
                />
                <LMarker
                  v-if="selectedCoordinates"
                  :lat-lng="[selectedCoordinates[1], selectedCoordinates[0]]"
                  :draggable="true"
                  @dragend="onMarkerDragEnd"
                >
                  <LPopup>
                    Selected Location: <br />
                    Lat: {{ selectedCoordinates[1].toFixed(4) }} <br />
                    Lng: {{ selectedCoordinates[0].toFixed(4) }}
                  </LPopup>
                </LMarker>
              </LMap>
            </div>
          </div>
        </ClientOnly>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              type="button"
              @click="$emit('cancel')"
              class="w-full sm:w-auto"
              variant="ghost"
              :disabled="submitting"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              class="w-full sm:w-auto"
              :disabled="submitting || !editForm.title.trim()"
              :loading="submitting"
            >
              Save Changes
            </UButton>
          </div>
        </template>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useProjects } from '~/composables/useProjects';
import { useTasks } from '~/composables/useTasks';
import { TaskPriority, TaskStatus, TaskType, type ITask, type GeoJSONPoint } from '~/types/task';
import { useAppToast } from '~/composables/useAppToast';
import { useLeaflet as useNuxtLeaflet } from '#imports';
import type { Map as LeafletMapInstance, LatLngExpression, LeafletMouseEvent, LeafletEvent } from 'leaflet';
import type { IUser } from '~/types/user';

interface Props {
  task: ITask | null;
  modelValue: boolean;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'save', taskId: string, updatedData: Partial<ITask>): void;
  (e: 'cancel'): void;
  (e: 'update:modelValue', value: boolean): void;
}>();

const { projects, pending: projectsPending, error: projectsError } = useProjects();
const { fieldOfficers, fieldOfficersPending, error: fieldOfficersError } = useTasks();
const toast = useAppToast();
const { L } = useNuxtLeaflet();

const submitting = ref(false);

interface EditForm {
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string | null;
  assignedTo: string[]; // This will hold an array of IDs from the USelect
  cost: number | null;
  taskType: TaskType;
  location: GeoJSONPoint | undefined;
}

const editForm = ref<EditForm>({
  title: '',
  description: null,
  priority: TaskPriority.Medium,
  status: TaskStatus.Pending,
  dueDate: null,
  projectId: null,
  assignedTo: [],
  cost: null,
  taskType: TaskType.Office,
  location: undefined,
});

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const mapRef = ref<InstanceType<typeof LMap> | null>(null);
const mapInstance = ref<LeafletMapInstance | null>(null);
const selectedCoordinates = ref<[number, number] | null>(null);
const initialMapZoom = 13;
const initialMapCenter = ref<LatLngExpression>([0.0, 38.0]);

const initializeForm = () => {
  if (props.task) {
    editForm.value = {
      title: props.task.title,
      description: props.task.description || null,
      priority: props.task.priority,
      status: props.task.status,
      dueDate: props.task.dueDate ? props.task.dueDate.split('T')[0] : null,
      projectId: (typeof props.task.project === 'object' && props.task.project !== null) ? props.task.project.id : props.task.projectId || null,
      // CRITICAL FIX: Ensure assignedTo is always an array of IDs, handling populated objects
      assignedTo: props.task.assignedTo?.map(a => typeof a === 'object' ? a.id : a) || [],
      cost: props.task.cost !== undefined ? props.task.cost : null,
      taskType: props.task.taskType || TaskType.Office,
      location: props.task.location ? { ...props.task.location } : undefined,
    };

    // Map initialization for existing location
    if (editForm.value.taskType === TaskType.Field && editForm.value.location) {
      initialMapCenter.value = [editForm.value.location.coordinates[1], editForm.value.location.coordinates[0]];
      selectedCoordinates.value = [...editForm.value.location.coordinates];
    } else {
      // Default behavior if no location or Office task
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            initialMapCenter.value = [lat, lng];
          },
          (error) => {
            console.warn("TaskEditModal: Geolocation error:", error.message);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }
  } else {
    // This branch should ideally not be hit if this is purely an EditModal
    editForm.value = {
      title: '', description: null, priority: TaskPriority.Medium, status: TaskStatus.Pending,
      dueDate: null, projectId: null, assignedTo: [], cost: null, taskType: TaskType.Office, location: undefined,
    };
    selectedCoordinates.value = null;
  }
};

watch(() => props.modelValue, (newValue) => {
  if (newValue) { // Modal is opening
    initializeForm();
    nextTick(() => {
      if (mapInstance.value) {
        mapInstance.value.invalidateSize({ pan: false });
        console.log('TaskEditModal: map.invalidateSize() called on modal open.');
      }
    });
  }
}, { immediate: true });

const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  if (editForm.value.taskType === TaskType.Field && selectedCoordinates.value) {
    const currentLatLng: LatLngExpression = [selectedCoordinates.value[1], selectedCoordinates.value[0]];
    mapInstance.value.setView(currentLatLng, initialMapZoom);
  } else if (L.value && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          mapInstance.value?.setView([lat, lng], initialMapZoom);
        },
        (error) => {
          console.warn("TaskEditModal: Geolocation error for map center:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
  }


  if (L.value) {
    mapInstance.value.on('click', (e: LeafletMouseEvent) => {
      selectedCoordinates.value = [e.latlng.lng, e.latlng.lat];
      editForm.value.location = {
        type: 'Point',
        coordinates: selectedCoordinates.value,
      };
      console.log('TaskEditModal: Map clicked, coordinates selected:', editForm.value.location);
    });
  }
};

const onMarkerDragEnd = (event: LeafletEvent) => {
  if (L.value) {
    const marker = event.target;
    const latLng = marker.getLatLng();
    selectedCoordinates.value = [latLng.lng, latLng.lat];
    editForm.value.location = {
      type: 'Point',
      coordinates: selectedCoordinates.value,
    };
    console.log('TaskEditModal: Marker dragged, new coordinates:', editForm.value.location);
  }
};

watch(() => editForm.value.taskType, (newType: TaskType) => {
  if (newType === TaskType.Office) {
    editForm.value.location = undefined;
    selectedCoordinates.value = null;
    console.log('TaskEditModal: Task type switched to Office, location cleared.');
  }
});

const today = computed(() => new Date().toISOString().split('T')[0]);

const projectOptions = computed(() =>
  projects.value.map((p) => ({ label: p.name, value: p.id }))
);

const fieldOfficerOptions = computed(() =>
  // Added 'Unassigned' option at the beginning
  [{ label: 'Unassigned', value: null }, ...(fieldOfficers.value?.map((fo: IUser) => ({ label: fo.name, value: fo.id })) || [])]
);


const saveChanges = async () => {
  if (!editForm.value.title.trim() || submitting.value) {
    toast.add({
      title: 'Validation Error',
      description: 'Task title cannot be empty.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
    return;
  }

  if (editForm.value.taskType === TaskType.Field && !editForm.value.location) {
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
      title: editForm.value.title.trim(),
      description: editForm.value.description || undefined,
      priority: editForm.value.priority,
      status: editForm.value.status,
      dueDate: editForm.value.dueDate
        ? new Date(`${editForm.value.dueDate}T00:00:00Z`).toISOString()
        : undefined,
      projectId: editForm.value.projectId || undefined,
      assignedTo: editForm.value.assignedTo.length > 0 ? editForm.value.assignedTo : undefined, // NEW: Send assignedTo if selected
      cost: editForm.value.cost !== null ? editForm.value.cost : undefined,
      taskType: editForm.value.taskType,
      location:
        editForm.value.taskType === TaskType.Field && editForm.value.location
          ? { type: 'Point', coordinates: editForm.value.location.coordinates }
          : undefined,
    };

    // Clean up undefined/null/empty string values from updatedData payload
    // This logic ensures that if a field is not explicitly meant to be set to null,
    // and it's undefined or empty from the form, it's not included in the payload.
    // However, explicitly nullable fields (description, dueDate, projectId, cost, location)
    // should pass null if that's the intention from the form.
    const finalUpdatedData: Partial<ITask> = {};
    for (const key in updatedData) {
      const value = updatedData[key as keyof Partial<ITask>];
      // For nullable fields, allow explicit null or undefined (if no change)
      if (value === null || value === undefined) {
          // If the original task had a value, and new value is undefined, it means no change.
          // If new value is explicitly null, it means clearing.
          // The backend expects null to clear, or undefined for no change.
          // So, if value is null, keep it. If value is undefined, it means no update for this field.
          if (value === null) {
              (finalUpdatedData as any)[key] = null;
          }
      } else if (typeof value === 'string' && value.trim() === '') {
          // Treat empty string for optional/nullable string fields as null/undefined
          (finalUpdatedData as any)[key] = null;
      } else if (key === 'assignedTo' && Array.isArray(value) && value.length === 0) {
          (finalUpdatedData as any)[key] = []; // Explicitly send empty array to clear assignments
      }
      else {
          (finalUpdatedData as any)[key] = value;
      }
    }


    emit('save', props.task!.id, finalUpdatedData); // Use finalUpdatedData
    // isModalOpen.value = false; // Moved to parent handleSaveEdit
  } catch (error: any) {
    console.error('Error preparing task update:', error);
    toast.add({
      title: 'Error Saving Task',
      description: error.data?.message || 'An unexpected error occurred while saving.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    submitting.value = false;
  }
};

const open = () => {
  isModalOpen.value = true;
};
defineExpose({ open });
</script>