<!-- components/dashboard/QuickAddTask.vue -->
<template>
  <div
    class="rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-sm"
    @keydown.esc="$emit('close')"
  >
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-200">Quick Add Task</h3>
      <button
        @click="$emit('close')"
        class="p-1 text-slate-400 transition-colors hover:text-slate-200"
        title="Close"
      >
        <Icon name="heroicons:x-mark" class="h-5 w-5" />
      </button>
    </div>

    <form @submit.prevent="submitTask" class="space-y-4">
      <div>
        <label
          for="quick-title"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          Task Title
        </label>
        <FormAppInput
          id="quick-title"
          v-model="form.title"
          placeholder="What needs to be done?"
          required
          class="w-full"
          :disabled="submitting"
        />
      </div>

      <div>
        <label
          for="quick-description"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          Description (optional)
        </label>
        <textarea
          id="quick-description"
          v-model="form.description"
          placeholder="Add more details about this task..."
          rows="2"
          class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          :disabled="submitting"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            for="quick-priority"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Priority
          </label>
          <select
            id="quick-priority"
            v-model="form.priority"
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
            for="quick-due-date"
            class="mb-1 block text-sm font-medium text-slate-300"
          >
            Due Date
          </label>
          <input
            id="quick-due-date"
            v-model="form.dueDate"
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
          for="quick-project"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          Assign to Project (optional)
        </label>
        <select
          id="quick-project"
          v-model="form.projectId"
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
          for="quick-cost"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          Cost (Optional)
        </label>
        <FormAppInput
          id="quick-cost"
          v-model.number="form.cost"
          type="number"
          placeholder="e.g., 50.00"
          class="w-full"
          :disabled="submitting"
          step="0.01"
        />
      </div>

      <!-- Task Type Selector (Office/Field) -->
      <div>
        <label
          for="task-type"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          Task Type
        </label>
        <select
          id="task-type"
          v-model="form.taskType"
          class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          :disabled="submitting"
        >
          <option :value="TaskType.Office">Office Task</option>
          <option :value="TaskType.Field">Field Task</option>
        </select>
      </div>

      <!-- Map Picker for Field Tasks -->
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
          <UiLeafletMap
            height="300px"
            :zoom="initialMapZoom"
            :center="initialMapCenter"
            @map-ready="onMapReady"
          />
        </div>
      </ClientOnly>

      <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <FormAppButton
          type="button"
          @click="$emit('close')"
          class="w-full sm:w-auto"
          variant="secondary"
          :disabled="submitting"
        >
          Cancel
        </FormAppButton>
        <FormAppButton
          type="submit"
          class="w-full sm:w-auto"
          :disabled="submitting || !form.title.trim()"
        >
          <UiSpinner v-if="submitting" size="sm" class="mr-2" />
          {{ submitting ? "Creating..." : "Create Task" }}
        </FormAppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTasks } from "~/composables/useTasks";
import { useProjects } from "~/composables/useProjects";
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type ITask,
  type GeoJSONPoint,
} from "~/types/task";
import { useToast } from "vue-toastification";
import UiLeafletMap from "~/components/ui/LeafletMap.vue";
import { useLeaflet } from "~/composables/useLeaflet";
import type {
  Map as LeafletMapInstance,
  LatLngExpression,
  LeafletMouseEvent,
  Marker as LeafletMarker,
} from "leaflet";

const { createTask } = useTasks();
const { projects, pending: projectsPending, error: projectsError } = useProjects();
const toast = useToast();
const { leaflet: L } = useLeaflet();

const emit = defineEmits<{
  (e: "task-created"): void;
  (e: "close"): void;
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
  title: "",
  description: "",
  priority: TaskPriority.Medium,
  dueDate: "",
  projectId: null,
  cost: null,
  taskType: TaskType.Office,
  location: undefined,
});

const today = computed(() => new Date().toISOString().split("T")[0]);

const mapInstance = ref<LeafletMapInstance | null>(null);
const locationMarker = ref<LeafletMarker | null>(null);

// --- THE CHANGES ARE HERE ---
const initialMapZoom = 10; // Changed from 13 to 10
const initialMapCenter = ref<LatLngExpression>([0.0, 38.0]); // Changed from London to Kenya

// --- UPDATED with robust error handling for geolocation ---
const onMapReady = (map: LeafletMapInstance) => {
  mapInstance.value = map;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const userLatLng: LatLngExpression = [lat, lng]; // Define userLatLng
        map.setView(userLatLng, initialMapZoom); // Use initialMapZoom
        initialMapCenter.value = userLatLng; // Update initial center if location found
      },
      (error) => {
        console.warn(`Geolocation error: ${error.message}. Using default map center.`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    console.warn("Geolocation is not supported by this browser.");
  }
  // CRITICAL: Attach the click listener only after the map is ready and Leaflet is loaded
  if (L.value) {
    map.on('click', handleMapClick);
  }
};

const handleMapClick = (e: LeafletMouseEvent) => {
  if (!L.value || !mapInstance.value) return;
  const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
  form.value.location = { type: "Point", coordinates: coords };

  if (!locationMarker.value) {
    locationMarker.value = L.value.marker(e.latlng).addTo(mapInstance.value);
  } else {
    locationMarker.value.setLatLng(e.latlng);
  }
  locationMarker.value
    .bindPopup(`Selected: Lat ${e.latlng.lat.toFixed(4)}, Lng ${e.latlng.lng.toFixed(4)}`)
    .openPopup();
};

watch([mapInstance, L], ([map, leaflet]) => {
  if (map && leaflet) {
    map.on("click", handleMapClick);
  }
});

watch(
  () => form.value.taskType,
  (newType) => {
    if (newType === TaskType.Office) {
      form.value.location = undefined;
      if (locationMarker.value && mapInstance.value) {
        locationMarker.value.remove();
        locationMarker.value = null;
      }
    }
  }
);

const submitTask = async () => {
  if (!form.value.title.trim() || submitting.value) return;

  if (form.value.taskType === TaskType.Field && !form.value.location) {
    toast.error("Please pick a location on the map for Field tasks.");
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
    emit("task-created");
    toast.success("Task created successfully!");

    form.value = {
      title: "",
      description: "",
      priority: TaskPriority.Medium,
      dueDate: "",
      projectId: null,
      cost: null,
      taskType: TaskType.Office,
      location: undefined,
    };
    if (locationMarker.value && mapInstance.value) {
      locationMarker.value.remove();
      locationMarker.value = null;
    }
  } catch (error: any) {
    console.error("Error creating task:", error);
    const errorMessage = error.data?.message || "An unexpected error occurred.";
    toast.error(`Error creating task: ${errorMessage}`);
  } finally {
    submitting.value = false;
  }
};
</script>