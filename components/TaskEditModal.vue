<!-- components/TaskEditModal.vue -->
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
import { TaskPriority, TaskStatus, TaskType, type ITask, type GeoJSONPoint } from '~/types/task';
import { useAppToast } from '~/composables/useAppToast';
import { useLeaflet as useNuxtLeaflet } from '#imports'; // Keep this for the L composable

// REMOVED: Explicit imports for LMap, LTileLayer, LMarker, LPopup.
// Nuxt's auto-import should handle these for template usage.
// If your IDE complains about types, you might need to import them as types, e.g.,
// import type { LMap, LTileLayer, LMarker, LPopup } from '@nuxtjs/leaflet';
// But the runtime import is what causes the error.

// Import types for core Leaflet objects directly from 'leaflet'
import type { Map as LeafletMapInstance, LatLngExpression, LeafletMouseEvent, LeafletEvent } from 'leaflet';

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
const toast = useAppToast();
const { L } = useNuxtLeaflet(); // Use the L object from the @nuxtjs/leaflet composable

const submitting = ref(false);

interface EditForm {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string | null;
  cost: number | null;
  taskType: TaskType;
  location: GeoJSONPoint | undefined;
}

const editForm = ref<EditForm>({
  title: '',
  description: null,
  priority: TaskPriority.Medium,
  dueDate: null,
  projectId: null,
  cost: null,
  taskType: TaskType.Office,
  location: undefined,
});

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const mapRef = ref<InstanceType<typeof LMap> | null>(null); // Ref to the LMap component
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
      dueDate: props.task.dueDate ? props.task.dueDate.split('T')[0] : null,
      projectId: props.task.projectId || null,
      cost: props.task.cost !== undefined ? props.task.cost : null,
      taskType: props.task.taskType || TaskType.Office,
      location: props.task.location ? { ...props.task.location } : undefined,
    };

    if (editForm.value.taskType === TaskType.Field && editForm.value.location) {
      initialMapCenter.value = [editForm.value.location.coordinates[1], editForm.value.location.coordinates[0]];
      selectedCoordinates.value = [...editForm.value.location.coordinates];
    } else {
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
  if (editForm.value.taskType === TaskType.Field && editForm.value.location) {
    const currentLatLng: LatLngExpression = [editForm.value.location.coordinates[1], editForm.value.location.coordinates[0]];
    mapInstance.value.setView(currentLatLng, initialMapZoom);
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
      cost: editForm.value.cost !== null ? editForm.value.cost : undefined,
      taskType: editForm.value.taskType,
      location:
        editForm.value.taskType === TaskType.Field && editForm.value.location
          ? { type: 'Point', coordinates: editForm.value.location.coordinates }
          : undefined,
    };

    Object.keys(updatedData).forEach((key) => {
      const value = (updatedData as any)[key];
      if (value === undefined || value === null) {
        delete (updatedData as any)[key];
      }
    });

    emit('save', props.task!.id, updatedData);
    isModalOpen.value = false;
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