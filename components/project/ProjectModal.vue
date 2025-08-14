<!-- components/project/ProjectModal.vue -->
<template>
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-2xl animate-in zoom-in duration-300" @click.stop>
      <form
        @submit.prevent="handleSubmit"
        class="max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 p-6"
        >
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEdit ? "Edit Project" : "Create New Project" }}
          </h2>
          <button
            type="button"
            @click="$emit('cancel')"
            class="p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="space-y-6 p-6">
          <div>
            <label
              :for="projectNameId"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              Project Name *
            </label>
            <FormAppInput
              :id="projectNameId"
              v-model="form.name"
              placeholder="e.g., Q4 Marketing Campaign"
              required
              class="w-full"
              :disabled="submitting"
            />
          </div>
          <div>
            <label
              :for="projectDescriptionId"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              :id="projectDescriptionId"
              v-model="form.description"
              placeholder="Describe what this project is about..."
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              :disabled="submitting"
            />
          </div>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                :for="projectStatusId"
                class="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                :id="projectStatusId"
                v-model="form.status"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :disabled="submitting"
              >
                <!-- Using enums for values -->
                <option :value="ProjectStatus.Active">Active</option>
                <option :value="ProjectStatus.OnHold">On Hold</option>
                <option :value="ProjectStatus.Completed">Completed</option>
                <option :value="ProjectStatus.Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label
                :for="projectPriorityId"
                class="mb-2 block text-sm font-medium text-gray-700"
              >
                Priority
              </label>
              <select
                :id="projectPriorityId"
                v-model="form.priority"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :disabled="submitting"
              >
                <!-- Using enums for values -->
                <option :value="ProjectPriority.Low">Low</option>
                <option :value="ProjectPriority.Medium">Medium</option>
                <option :value="ProjectPriority.High">High</option>
              </select>
            </div>
          </div>
          <!-- Date inputs -->
          <div>
            <label
              :for="projectStartDateId"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              :id="projectStartDateId"
              v-model="form.startDate"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              :disabled="submitting"
            />
          </div>
          <div>
            <label
              :for="projectEndDateId"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              :id="projectEndDateId"
              v-model="form.endDate"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              :disabled="submitting"
            />
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="flex flex-col-reverse gap-3 border-t border-gray-200 p-6 sm:flex-row sm:justify-end"
        >
          <FormAppButton
            type="button"
            @click="$emit('cancel')"
            variant="secondary"
            :disabled="submitting"
          >
            Cancel
          </FormAppButton>
          <FormAppButton
            type="submit"
            :disabled="submitting || !form.name.trim()"
          >
            <UiSpinner v-if="submitting" size="sm" class="mr-2" />
            {{
              submitting
                ? "Saving..."
                : isEdit
                ? "Update Project"
                : "Create Project"
            }}
          </FormAppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Ref } from "vue";
import { useId } from '#app';
import { type IProject, ProjectStatus, ProjectPriority } from "~/types/project";

// Use useId for unique and accessible IDs
const projectNameId = useId();
const projectDescriptionId = useId();
const projectStatusId = useId();
const projectPriorityId = useId();
const projectStartDateId = useId();
const projectEndDateId = useId();

const props = defineProps<{
  project: IProject | null;
}>();

const emit = defineEmits<{
  (e: "save", projectData: Partial<IProject>): void;
  (e: "cancel"): void;
}>();

const isEdit = computed(() => !!props.project?.id);
const submitting = ref(false);

interface ProjectFormState {
  id?: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string | null;
  endDate?: string | null;
}

const getInitialFormState = (): ProjectFormState => ({
  name: "",
  description: null,
  status: ProjectStatus.Active,
  priority: ProjectPriority.Medium,
  startDate: null,
  endDate: null,
});

const form: Ref<ProjectFormState> = ref(getInitialFormState());

watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      form.value = {
        id: newProject.id,
        name: newProject.name || "",
        description: newProject.description || null,
        status: newProject.status || ProjectStatus.Active,
        priority: newProject.priority || ProjectPriority.Medium,
        startDate: newProject.startDate ? new Date(newProject.startDate).toISOString().split("T")[0] : null,
        endDate: newProject.endDate ? new Date(newProject.endDate).toISOString().split("T")[0] : null,
      };
    } else {
      form.value = getInitialFormState();
    }
  },
  { immediate: true, deep: true }
);

const handleSubmit = async () => {
  if (!form.value.name.trim() || submitting.value) {
    console.warn("ProjectModal: Form submission blocked due to empty name or already submitting.");
    return;
  }
  submitting.value = true;
  try {
    const payload: Partial<IProject> = {
      name: form.value.name,
      description: form.value.description?.trim() || undefined,
      status: form.value.status,
      priority: form.value.priority,
      startDate: form.value.startDate ? new Date(`${form.value.startDate}T00:00:00Z`).toISOString() : undefined,
      endDate: form.value.endDate ? new Date(`${form.value.endDate}T00:00:00Z`).toISOString() : undefined,
    };

    Object.keys(payload).forEach((key) => {
      // @ts-ignore
      if (payload[key] === undefined) {
        // @ts-ignore
        delete payload[key];
      }
    });

    console.log("ProjectModal: Emitting 'save' event with payload:", payload);
    emit("save", payload);
  } catch (error) {
    console.error("ProjectModal: Error preparing project data for save:", error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      console.log("ProjectModal: Escape key pressed, emitting 'cancel'.");
      emit("cancel");
    }
  };
  document.addEventListener("keydown", handleEscape);
  onUnmounted(() => {
    console.log("ProjectModal: Component unmounted, removing keydown listener.");
    document.removeEventListener("keydown", handleEscape);
  });
});
</script>