<!-- components/TaskEditModal.vue -->
<template>
  <div
    v-if="task"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="$emit('cancel')"
    @keydown.esc="$emit('cancel')"
  >
    <div
      class="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg"
    >
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-xl font-semibold text-slate-200">Edit Task</h3>
        <button
          @click="$emit('cancel')"
          class="p-1 text-slate-400 transition-colors hover:text-slate-200"
          title="Close"
        >
          <Icon name="heroicons:x-mark" class="h-6 w-6" />
        </button>
      </div>

      <form @submit.prevent="saveChanges" class="space-y-4">
        <div>
          <label
            for="edit-title"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Task Title
          </label>
          <FormAppInput
            id="edit-title"
            v-model="editForm.title"
            placeholder="What needs to be done?"
            required
            class="w-full"
            :disabled="submitting"
          />
        </div>

        <div>
          <label
            for="edit-description"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Description (optional)
          </label>
          <textarea
            id="edit-description"
            v-model="editForm.description"
            placeholder="Add more details about this task..."
            rows="2"
            class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            :disabled="submitting"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="edit-priority"
              class="mb-1 block text-sm font-medium text-slate-300"
            >
              Priority
            </label>
            <select
              id="edit-priority"
              v-model="editForm.priority"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
            >
              <option :value="TaskPriority.Low">Low</option>
              <option :value="TaskPriority.Medium">Medium</option>
              <option :value="TaskPriority.High">High</option>
              <option :value="TaskPriority.Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label
              for="edit-due-date"
              class="mb-1 block text-sm font-medium text-slate-300"
            >
              Due Date
            </label>
            <input
              id="edit-due-date"
              v-model="editForm.dueDate"
              type="date"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
              :min="today"
            />
          </div>
        </div>

        <!-- Project Selector -->
        <div>
          <label
            for="edit-project"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Assign to Project (optional)
          </label>
          <select
            id="edit-project"
            v-model="editForm.projectId"
            class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            :disabled="submitting || projectsPending"
          >
            <option :value="null">No Project</option>
            <option v-if="projectsPending" disabled>Loading projects...</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
          <p v-if="projectsError" class="mt-1 text-xs text-rose-400">
            Error loading projects: {{ projectsError.message }}
          </p>
        </div>

        <!-- Cost Input -->
        <div>
          <label
            for="edit-cost"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Cost (Optional)
          </label>
          <FormAppInput
            id="edit-cost"
            v-model.number="editForm.cost"
            type="number"
            placeholder="e.g., 50.00"
            class="w-full"
            :disabled="submitting"
            step="0.01"
          />
        </div>

        <!-- NEW: Task Type Selector (Office/Field) -->
        <div>
          <label
            for="edit-task-type"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Task Type
          </label>
          <select
            id="edit-task-type"
            v-model="editForm.taskType"
            class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            :disabled="submitting"
          >
            <option :value="TaskType.Office">Office Task</option>
            <option :value="TaskType.Field">Field Task</option>
          </select>
        </div>

        <!-- NEW: Map Picker for Field Tasks -->
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
          <UiLeafletMap
            height="300px"
            :zoom="initialMapZoom"
            :center="initialMapCenter"
            @map-ready="onMapReady"
          >
            <!-- LMarker and LPopup are recognized globally by TS from vue-shims.d.ts -->
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
          </UiLeafletMap>
        </div>

        <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <FormAppButton
            type="button"
            @click="$emit('cancel')"
            class="w-full sm:w-auto"
            variant="secondary"
            :disabled="submitting"
            >Cancel</FormAppButton
          >
          <FormAppButton
            type="submit"
            class="w-full sm:w-auto"
            :disabled="submitting || !editForm.title.trim()"
          >
            <UiSpinner v-if="submitting" size="sm" class="mr-2" />
            {{ submitting ? "Saving..." : "Save Changes" }}
          </FormAppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'; // Ensure all core Vue functions are imported
import { useProjects } from '~/composables/useProjects';
import { TaskPriority, TaskStatus, TaskType, type ITask, type GeoJSONPoint } from '~/types/task';
import { useToast } from 'vue-toastification';
import { useNuxtApp } from '#app'; // This should now resolve correctly via vue-shims.d.ts

// Import types for core Leaflet objects.
import type { Map as LeafletMapInstance, LatLngExpression, LeafletMouseEvent, LeafletEvent } from 'leaflet';

// Import the base map component (must be explicitly imported as it's a local component)
import UiLeafletMap from '~/components/ui/LeafletMap.vue';

interface Props {
  task: ITask;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'save', taskId: string, updatedData: Partial<ITask>): void;
  (e: 'cancel'): void;
}>();

const { projects, pending: projectsPending, error: projectsError } = useProjects();
const toast = useToast();
const { $leaflet: L } = useNuxtApp(); // Get the injected Leaflet instance (L)

const submitting = ref(false);

interface EditForm {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string | null;
  cost: number | null;
  taskType: TaskType; // NEW: TaskType for editing
  location: GeoJSONPoint | undefined; // NEW: Location for editing
}

const editForm = ref<EditForm>({
  title: '',
  description: null,
  priority: TaskPriority.Medium,
  dueDate: null,
  projectId: null,
  cost: null,
  taskType: TaskType.Office, // Default, will be overridden by task prop
  location: undefined, // Default, will be overridden by task prop
});

// --- Map Related State and Functions ---
const mapInstance = ref<LeafletMapInstance | null>(null);
const selectedCoordinates = ref<[number, number] | null>(null); // [longitude, latitude] to match GeoJSON
const initialMapZoom = 13;
const initialMapCenter = ref<LatLngExpression>([51.505, -0.09]); // Default: London

// Initialize form from props.task
const initializeForm = () => {
  editForm.value = {
    title: props.task.title,
    description: props.task.description || null,
    priority: props.task.priority,
    dueDate: props.task.dueDate ? props.task.dueDate.split('T')[0] : null, // Format for input type="date"
    projectId: props.task.projectId || null,
    cost: props.task.cost !== undefined ? props.task.cost : null,
    taskType: props.task.taskType || TaskType.Office, // Initialize taskType
    location: props.task.location ? { ...props.task.location } : undefined, // Initialize location
  };

  // Set initial map center and marker if location exists and is a field task
  // Only update map view if the map instance is ready
  if (editForm.value.taskType === TaskType.Field && editForm.value.location && L) {
    initialMapCenter.value = [editForm.value.location.coordinates[1], editForm.value.location.coordinates[0]];
    selectedCoordinates.value = [...editForm.value.location.coordinates];
    const zoomLevel = 16; // Zoom in more if location is known

    // If map is already ready, update its view
    if (mapInstance.value) {
      mapInstance.value.setView(initialMapCenter.value, zoomLevel);
    }
  } else {
    // If no existing location or not a field task, try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          initialMapCenter.value = [lat, lng];
          if (mapInstance.value) { // Update if map is already ready
            mapInstance.value.setView(initialMapCenter.value, initialMapZoom);
          }
          console.log("TaskEditModal: User location found:", [lat, lng]);
        },
        (error) => {
          console.warn("TaskEditModal: Geolocation error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }
};

// Initialize on component mount and whenever task prop changes
// `immediate: true` runs it on initial mount. `deep: true` not strictly needed for props.task ref,
// but fine if props.task itself is a reactive object that changes internally.
onMounted(initializeForm); // Call initializeForm on mount
watch(() => props.task, initializeForm, { deep: true }); // Watch task prop for changes

const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  // If the form initialized with a location, ensure the map centers there
  if (editForm.value.taskType === TaskType.Field && editForm.value.location && L) {
    const currentLatLng: LatLngExpression = [editForm.value.location.coordinates[1], editForm.value.location.coordinates[0]];
    mapInstance.value.setView(currentLatLng, initialMapZoom); // Use initialMapZoom for consistency with prop.
  }

  // Add click listener to the map to pick location
  if (mapInstance.value && L) {
    mapInstance.value.on('click', (e: LeafletMouseEvent) => {
      selectedCoordinates.value = [e.latlng.lng, e.latlng.lat]; // [lng, lat] for GeoJSON
      editForm.value.location = {
        type: 'Point',
        coordinates: selectedCoordinates.value,
      };
      console.log('TaskEditModal: Map clicked, coordinates selected:', editForm.value.location);
    });
  }
};

const onMarkerDragEnd = (event: LeafletEvent) => { // Type event as LeafletEvent
  if (L) {
    const marker = event.target;
    const latLng = marker.getLatLng();
    selectedCoordinates.value = [latLng.lng, latLng.lat]; // [lng, lat] for GeoJSON
    editForm.value.location = {
      type: 'Point',
      coordinates: selectedCoordinates.value,
    };
    console.log('TaskEditModal: Marker dragged, new coordinates:', editForm.value.location);
  }
};

// Watch taskType to clear location if switched to Office
watch(() => editForm.value.taskType, (newType: TaskType) => { // Type newType as TaskType
  if (newType === TaskType.Office) {
    editForm.value.location = undefined;
    selectedCoordinates.value = null;
    console.log('TaskEditModal: Task type switched to Office, location cleared.');
  }
});
// --- End Map Related Functions ---

const today = computed(() => new Date().toISOString().split('T')[0]);

const saveChanges = async () => {
  if (!editForm.value.title.trim() || submitting.value) return;

  // Validation for field tasks: ensure location is picked
  if (editForm.value.taskType === TaskType.Field && !editForm.value.location) {
    toast.error('Please pick a location on the map for Field tasks.');
    return;
  }

  submitting.value = true;
  try {
    const updatedData: Partial<ITask> = {
      title: editForm.value.title.trim(),
      description: editForm.value.description || undefined,
      priority: editForm.value.priority,
      status: editForm.value.status, // Ensure status is passed
      dueDate: editForm.value.dueDate
        ? new Date(`${editForm.value.dueDate}T00:00:00Z`).toISOString()
        : undefined,
      projectId: editForm.value.projectId || undefined,
      cost: editForm.value.cost !== null ? editForm.value.cost : undefined,
      taskType: editForm.value.taskType, // Include taskType
      location:
        editForm.value.taskType === TaskType.Field && editForm.value.location
          ? { type: 'Point', coordinates: editForm.value.location.coordinates }
          : undefined, // Include location conditionally
    };

    // Clean up undefined properties for the API payload
    Object.keys(updatedData).forEach((key) => {
      // Use explicit type guard or assertion instead of @ts-ignore if possible
      const value = (updatedData as any)[key];
      if (value === undefined || value === null) { // Also remove null for optional fields if API expects absence
        delete (updatedData as any)[key];
      }
    });

    emit('save', props.task.id, updatedData);
    // The parent component (pages/dashboard/index.vue) will handle the API call and toast
  } catch (error: any) {
    console.error('Error preparing task update:', error);
    toast.error('Error preparing task update.');
  } finally {
    submitting.value = false;
  }
};
</script>