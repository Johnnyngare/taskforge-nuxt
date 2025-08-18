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

      <!-- New: Cost Input (for Checklist Item 2) -->
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
      
      <!-- New: Assigned To (for Checklist Item 5) -->
      <!-- This would typically be a multi-select for users -->
      <!-- <div>
        <label for="quick-assigned-to" class="mb-1 block text-sm font-medium text-slate-300">
          Assign To (Optional)
        </label>
        <select
          id="quick-assigned-to"
          v-model="form.assignedTo"
          class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          :disabled="submitting"
        >
          <option :value="null">Unassigned</option>
        </select>
      </div> -->

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
import { ref, computed } from "vue";
import { useTasks } from "~/composables/useTasks";
import { useProjects } from "~/composables/useProjects";
import { TaskPriority, TaskStatus, type ITask } from "~/types/task";
import { useToast } from 'vue-toastification';

const { createTask } = useTasks();
const { projects, pending: projectsPending, error: projectsError } = useProjects();
const toast = useToast();

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
  assignedTo?: string[];
}

const form = ref<QuickAddForm>({
  title: "",
  description: "",
  priority: TaskPriority.Medium,
  dueDate: "",
  projectId: null,
  cost: null,
  assignedTo: [],
});

const today = computed(() => new Date().toISOString().split("T")[0]);

const submitTask = async () => {
  if (!form.value.title.trim() || submitting.value) return;

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
      cost: form.value.cost !== null ? form.value.cost : undefined,
    };

    await createTask(taskData);
    emit("task-created");

    // Reset form fields
    form.value = {
      title: "",
      description: "",
      priority: TaskPriority.Medium,
      dueDate: "",
      projectId: null,
      cost: null,
      assignedTo: [],
    };

    toast.success("Task created successfully!"); // CHANGED: Simple string message

  } catch (error: any) {
    console.error("Error creating task:", error);
    const errorMessage = error.data?.message || "An unexpected error occurred.";
    toast.error(`Error creating task: ${errorMessage}`); // CHANGED: Simple string message
  } finally {
    submitting.value = false;
  }
};
</script>