<!-- components/TaskEditModal.vue -->
<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-2xl animate-in zoom-in duration-300" @click.stop>
      <form
        @submit.prevent="handleSubmit"
        class="max-h-[90vh] w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-xl"
      >
        <div
          class="flex items-center justify-between border-b border-slate-700 p-6"
        >
          <h2 class="text-xl font-semibold text-slate-200">Edit Task</h2>
          <button
            type="button"
            @click="$emit('cancel')"
            class="p-1 text-slate-400 transition-colors hover:text-slate-200"
            title="Close"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>

        <div class="space-y-6 p-6">
          <div>
            <label
              :for="titleId"
              class="mb-2 block text-sm font-medium text-slate-300"
              >Task Title *</label
            >
            <FormAppInput
              :id="titleId"
              v-model="form.title"
              placeholder="What needs to be done?"
              required
              class="w-full"
              :disabled="submitting"
            />
          </div>
          <div>
            <label
              :for="descriptionId"
              class="mb-2 block text-sm font-medium text-slate-300"
              >Description</label
            >
            <textarea
              :id="descriptionId"
              v-model="form.description"
              rows="4"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
            />
          </div>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                :for="statusId"
                class="mb-2 block text-sm font-medium text-slate-300"
                >Status</label
              >
              <select
                :id="statusId"
                v-model="form.status"
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                :disabled="submitting"
              >
                <option :value="TaskStatus.Pending">Pending</option>
                <option :value="TaskStatus.InProgress">In Progress</option>
                <option :value="TaskStatus.Completed">Completed</option>
                <option :value="TaskStatus.Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label
                :for="priorityId"
                class="mb-2 block text-sm font-medium text-slate-300"
                >Priority</label
              >
              <select
                :id="priorityId"
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
          </div>
          <div>
            <label
              :for="dueDateId"
              class="mb-2 block text-sm font-medium text-slate-300"
              >Due Date</label
            >
            <input
              :id="dueDateId"
              v-model="form.dueDate"
              type="date"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
            />
          </div>

          <!-- Project Selector for Editing -->
          <div>
            <label
              for="edit-task-project"
              class="mb-2 block text-sm font-medium text-slate-300"
            >
              Assign to Project (optional)
            </label>
            <select
              id="edit-task-project"
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

          <!-- Cost Input (for Checklist Item 2) -->
          <div>
            <label
              for="edit-task-cost"
              class="mb-2 block text-sm font-medium text-slate-300"
            >
              Cost (Optional)
            </label>
            <FormAppInput
              id="edit-task-cost"
              v-model.number="form.cost"
              type="number"
              placeholder="e.g., 50.00"
              class="w-full"
              :disabled="submitting"
              step="0.01"
            />
          </div>
          
          <!-- New: Assigned To (for Checklist Item 5) -->
          <!-- This would typically be a multi-select for users -->
          <!-- <div>
            <label for="edit-task-assigned-to" class="mb-2 block text-sm font-medium text-slate-300">
              Assign To (Optional)
            </label>
            <select
              id="edit-task-assigned-to"
              v-model="form.assignedTo"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
            >
              <option :value="null">Unassigned</option>
            </select>
          </div> -->
        </div>

        <div
          class="flex flex-col-reverse gap-3 border-t border-slate-700 p-6 sm:flex-row sm:justify-end"
        >
          <FormAppButton
            type="button"
            @click="$emit('cancel')"
            variant="secondary"
            :disabled="submitting"
            >Cancel</FormAppButton
          >
          <FormAppButton
            type="submit"
            :disabled="submitting || !form.title.trim()"
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useId } from '#app';
import { TaskPriority, TaskStatus, type ITask } from "~/types/task";
import { useProjects } from "~/composables/useProjects";

const titleId = useId();
const descriptionId = useId();
const statusId = useId();
const priorityId = useId();
const dueDateId = useId();

const props = defineProps<{
  task: ITask;
}>();

const emit = defineEmits<{
  (e: "save", taskId: string, updates: Partial<ITask>): void;
  (e: "cancel"): void;
}>();

const submitting = ref(false);
const { projects, pending: projectsPending, error: projectsError } = useProjects();

interface EditForm {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
  cost?: number | null;
  assignedTo?: string[];
}

const form = ref<EditForm>({
  id: "",
  title: "",
  description: null,
  status: TaskStatus.Pending,
  priority: TaskPriority.Medium,
  dueDate: null,
  projectId: null,
  cost: null,
  assignedTo: [],
});

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      form.value = {
        id: newTask.id,
        title: newTask.title || "",
        description: newTask.description || null,
        status: newTask.status || TaskStatus.Pending,
        priority: newTask.priority || TaskPriority.Medium,
        dueDate: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString().split("T")[0]
          : null,
        projectId: newTask.projectId || null,
        cost: newTask.cost || null,
        assignedTo: newTask.assignedTo || [],
      };
    }
  },
  { immediate: true, deep: true }
);

const handleSubmit = async () => {
  if (!form.value.title?.trim() || submitting.value || !form.value.id) {
    return;
  }

  submitting.value = true;
  try {
    const payload: Partial<ITask> = {
      title: form.value.title,
      description: form.value.description?.trim() || undefined,
      status: form.value.status,
      priority: form.value.priority,
      dueDate: form.value.dueDate
        ? new Date(`${form.value.dueDate}T00:00:00Z`).toISOString()
        : undefined,
      projectId: form.value.projectId || undefined,
      cost: form.value.cost !== null ? form.value.cost : undefined,
      // assignedTo: form.value.assignedTo, // Include assignedTo if editable
    };

    Object.keys(payload).forEach((key) => {
      // @ts-ignore
      if (payload[key] === undefined) {
        // @ts-ignore
        delete payload[key];
      }
    });

    emit("save", form.value.id, payload);
  } catch (error) {
    console.error("Error preparing task updates in modal:", error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  const handleEscape = (e: KeyboardEvent) =>
    e.key === "Escape" && emit("cancel");
  document.addEventListener("keydown", handleEscape);
  onUnmounted(() => document.removeEventListener("keydown", handleEscape));
});
</script>