<!-- pages/dashboard/tasks.vue -->
<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">All Tasks</h1>
        <p class="text-slate-400">Manage and organize all your tasks</p>
      </div>
      <FormAppButton @click="showCreateModal = true">
        <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
        Add Task
      </FormAppButton>
    </div>

    <!-- Filter Options -->
    <div
      class="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-md"
    >
      <div class="flex flex-wrap items-center gap-4">
        <label for="status-filter" class="text-sm font-medium text-slate-300">
          Filter by Status:
        </label>
        <select
          id="status-filter"
          v-model="filterStatus"
          class="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          <option :value="null">All</option>
          <option v-for="status in TaskStatus" :key="status" :value="status">
            {{ status }}
          </option>
        </select>

        <label for="type-filter" class="text-sm font-medium text-slate-300">
          Filter by Type:
        </label>
        <select
          id="type-filter"
          v-model="filterType"
          class="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          <option :value="null">All</option>
          <option v-for="type in TaskType" :key="type" :value="type">
            {{ type }} Task
          </option>
        </select>
      </div>
    </div>

    <!-- Map Display Section (conditionally shown based on filterType) -->
    <DashboardFieldTasksMap
      v-if="filterType === TaskType.Field"
      :tasks="tasks || []"
      class="mb-6"
    />
    <div v-else-if="filterType === TaskType.Field && filteredTasks.length === 0" class="mb-6 text-slate-400 text-sm text-center py-8">
      No field tasks found with the current filters.
    </div>


    <div class="rounded-xl border border-slate-700 bg-slate-800">
      <div v-if="pending" class="flex justify-center p-12">
        <UiSpinner class="h-8 w-8 text-emerald-500" />
      </div>

      <div v-else-if="error" class="p-12 text-center">
        <p class="mb-4 text-rose-400">Failed to load tasks</p>
        <FormAppButton @click="refresh()" variant="secondary">
          Try Again
        </FormAppButton>
      </div>

      <div v-else class="p-4">
        <div v-if="filteredTasks.length === 0" class="text-center text-slate-400 py-8">
          No tasks found matching your criteria.
        </div>
        <TaskList
          v-else
          :tasks="filteredTasks"
          @task-updated="handleTaskUpdate"
          @task-deleted="handleTaskDelete"
          @edit-task="handleEditTask"
        />
      </div>
    </div>

    <TaskEditModal
      v-if="editingTask"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="editingTask = null"
    />
    <DashboardQuickAddTask
      v-if="showCreateModal"
      @task-created="handleTaskCreated"
      @close="showCreateModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, computed } from "vue"; // Added computed
import { useTasks } from "~/composables/useTasks";
import { TaskStatus, TaskType, type ITask } from "~/types/task"; // Added TaskType
import { useToast } from 'vue-toastification'; // Added useToast

// Import necessary local components
import DashboardFieldTasksMap from '~/components/dashboard/DashboardFieldTasksMap.vue';
import DashboardQuickAddTask from '~/components/dashboard/QuickAddTask.vue';
import TaskEditModal from '~/components/TaskEditModal.vue'; // Corrected path

definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "All Tasks - TaskForge",
});

const toast = useToast();
const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks();

const showCreateModal = ref(false);
const editingTask: Ref<ITask | null> = ref(null);

const filterStatus = ref<TaskStatus | null>(null); // Added filterStatus
const filterType = ref<TaskType | null>(null); // Added filterType

const filteredTasks = computed(() => { // Added filteredTasks computed property
  if (!Array.isArray(tasks.value)) return [];

  return tasks.value.filter((task: ITask) => {
    const matchesStatus = filterStatus.value ? task.status === filterStatus.value : true;
    const matchesType = filterType.value ? task.taskType === filterType.value : true;
    return matchesStatus && matchesType;
  });
});

// Added this computed property back for the v-else-if condition on the map
const fieldTasks = computed(() => {
  return filteredTasks.value.filter((task) => task.taskType === TaskType.Field);
});


const handleTaskCreated = () => {
  showCreateModal.value = false;
  refresh(); // Important: Refresh tasks after creation to show new task
  toast.success("Task created!"); // Changed toast call
};

const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => {
  try { // Added try/catch for proper error handling and toast messages
    await updateTask(taskId, updates);
    refresh(); // Important: Refresh tasks after update
    toast.success("Task updated!"); // Changed toast call
  } catch (err: unknown) {
    const errorMessage = (err as any).data?.message || 'An unexpected error occurred.';
    toast.error(`Error updating task: ${errorMessage}`);
  }
};

const handleTaskDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try { // Added try/catch for proper error handling and toast messages
    await deleteTask(taskId);
    refresh(); // Important: Refresh tasks after deletion
    toast.info("Task deleted!"); // Changed toast call
  } catch (err: unknown) {
    const errorMessage = (err as any).data?.message || 'An unexpected error occurred.';
    toast.error(`Error deleting task: ${errorMessage}`);
  }
};

const handleEditTask = (taskId: string) => {
  const foundTask = tasks.value?.find((t) => t.id === taskId);
  if (foundTask) {
    editingTask.value = foundTask;
  }
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  try { // Added try/catch for proper error handling and toast messages
    await updateTask(taskId, updatedData);
    editingTask.value = null;
    refresh(); // Important: Refresh tasks after save
    toast.success("Task saved!"); // Changed toast call
  } catch (err: unknown) {
    const errorMessage = (err as any).data?.message || 'An unexpected error occurred.';
    toast.error(`Error saving task: ${errorMessage}`);
  }
};

// Added formatDate helper if needed in template (not strictly used in this specific template, but good practice)
const formatDate = (dateString?: string) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";
</script>