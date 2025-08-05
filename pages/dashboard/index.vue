// pages/dashboard/index.vue
<template>
  <div>
    <!-- Welcome Banner (Revised to show authenticated user name and current task count) -->
    <div
      class="mb-6 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-6"
    >
      <h1 class="text-2xl font-bold text-white mb-2">
        Welcome back, {{ user?.name || "TaskForge User" }}!
      </h1>
      <p class="text-slate-400">
        You have {{ tasks?.length || 0 }} tasks to manage today.
      </p>
    </div>

    <!-- Quick Actions Bar -->
    <div
      class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div class="flex flex-wrap gap-3">
        <FormAppButton @click="showQuickAdd = true">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Add Task
        </FormAppButton>
      </div>
      <div class="text-sm text-slate-400">
        {{ tasks?.length || 0 }}
        {{ (tasks?.length || 0) === 1 ? "task" : "tasks" }} total
      </div>
    </div>

    <!-- Quick Add Task Modal -->
    <DashboardQuickAddTask
      v-if="showQuickAdd"
      @task-created="handleTaskCreated"
      @close="showQuickAdd = false"
    />

    <!-- Dashboard Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Task List Area -->
      <div class="lg:col-span-2">
        <div
          class="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-md"
        >
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-200">Recent Tasks</h2>
            <NuxtLink
              to="/dashboard/tasks"
              class="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              View All
            </NuxtLink>
          </div>

          <!-- Loading State for Tasks -->
          <div v-if="pending" class="flex justify-center py-8">
            <UiSpinner class="h-6 w-6 text-emerald-500" />
          </div>

          <!-- Error State for Tasks -->
          <div v-else-if="error" class="py-8 text-center">
            <p class="mb-4 text-rose-400">Failed to load tasks</p>
            <FormAppButton @click="refresh" variant="secondary">
              Try Again
            </FormAppButton>
          </div>

          <!-- Task List Component -->
          <TaskList
            v-else
            :tasks="tasks.slice(0, 6)"
            @task-updated="handleTaskUpdate"
            @task-deleted="handleTaskDelete"
            @edit-task="handleEditTask"
          />
        </div>
      </div>

      <!-- Sidebar Widgets -->
      <div class="space-y-6">
        <!-- Productivity Stats Widget -->
        <div class="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h3 class="text-lg font-semibold text-slate-200 mb-4">
            Productivity Stats
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-400">Completed</span>
              <span class="text-emerald-400 font-semibold">
                {{ completedTasksCount }}/{{ tasks?.length || 0 }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Pending</span>
              <span class="text-yellow-400 font-semibold">{{
                pendingTasksCount
              }}</span>
            </div>
          </div>
        </div>

        <!-- Upcoming Deadlines Widget -->
        <div class="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h3 class="text-lg font-semibold text-slate-200 mb-4">
            Upcoming Deadlines
          </h3>
          <div v-if="upcomingTasks.length === 0" class="text-slate-400 text-sm">
            No upcoming deadlines
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="task in upcomingTasks.slice(0, 3)"
              :key="task._id"
              class="text-sm"
            >
              <div class="text-slate-300">{{ task.title }}</div>
              <div class="text-slate-500">{{ formatDate(task.dueDate) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Edit Modal -->
    <TaskEditModal
      v-if="showEditModal"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="showEditModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from "vue"; // Ensure Ref is imported for explicit typing
import { useTasks } from "~/composables/useTasks";
import { useAuth } from "~/composables/useAuth";
// useToast is typically auto-imported by @nuxt/ui, so explicit import is often not needed
// If you're getting TS errors like 'Module "#app" has no exported member 'useToast'',
// it means useToast is already globally available via @nuxt/ui.
// For now, removing the explicit import:
// import { useToast } from "#app";

// Import ITask if you put it in a global types file
import type { ITask } from "~/types/task";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoMeta({
  title: "Dashboard - TaskForge",
  description: "Manage your tasks and projects efficiently.",
});

// Composables
const { tasks, pending, error, refresh, createTask, updateTask, deleteTask } =
  useTasks();
const { user } = useAuth();
const toast = useToast(); // This relies on auto-import for useToast

// Local UI state
const showQuickAdd = ref<boolean>(false);
const showEditModal = ref<boolean>(false);
// Correctly type editingTask to allow ITask or null
const editingTask: Ref<ITask | null> = ref(null);

// Computed properties for stats
const completedTasksCount = computed(() => {
  return tasks.value?.filter((task) => task.status === "completed").length || 0;
});

const pendingTasksCount = computed(() => {
  return tasks.value?.filter((task) => task.status === "pending").length || 0;
});

const upcomingTasks = computed(() => {
  if (!tasks.value) return [];
  const now = new Date();
  return tasks.value
    .filter((task) => {
      // Ensure dueDate exists and is a valid string, then create a Date object.
      // Filter out tasks where dueDate is not a valid date string.
      if (!task.dueDate || typeof task.dueDate !== "string") {
        return false;
      }
      const dueDate = new Date(task.dueDate);
      // Check if dueDate is a valid Date object before comparing
      return !isNaN(dueDate.getTime()) && dueDate > now;
    })
    .sort((a, b) => {
      // Ensure dueDate is treated as a string before creating Date objects for comparison
      // The filter above guarantees task.dueDate is a string now.
      const dateA = new Date(a.dueDate as string);
      const dateB = new Date(b.dueDate as string);

      // Ensure both are valid Date objects before arithmetic comparison
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0; // Fallback for invalid dates
      }

      return dateA.getTime() - dateB.getTime(); // Use .getTime() for reliable comparison
    });
});

// Handlers for Task CRUD operations
const handleTaskCreated = async () => {
  showQuickAdd.value = false;
  toast.add({
    title: "Task created!",
    icon: "i-heroicons-check-circle",
    color: "green",
  });
};

const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => {
  try {
    await updateTask(taskId, updates);
    toast.add({
      title: "Task updated!",
      icon: "i-heroicons-check-circle",
      color: "green",
    });
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to update task.";
    const detailedErrorMessage = err?.data?.message || errorMessage;
    console.error("Failed to update task:", err);
    toast.add({
      title: "Error updating task",
      description: detailedErrorMessage,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const handleTaskDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }
  try {
    await deleteTask(taskId);
    toast.add({
      title: "Task deleted!",
      icon: "i-heroicons-trash",
      color: "orange",
    });
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to delete task.";
    const detailedErrorMessage = err?.data?.message || errorMessage;
    console.error("Failed to delete task:", err);
    toast.add({
      title: "Error deleting task",
      description: detailedErrorMessage,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const handleEditTask = (taskId: string) => {
  // Find the task from the reactive `tasks` array
  const foundTask = tasks.value?.find((t) => t._id === taskId);
  // Assign the found task (or null if not found) to editingTask
  editingTask.value = foundTask || null;

  if (editingTask.value) {
    // Only show modal if a task was found
    showEditModal.value = true;
  } else {
    console.warn(`Task with ID ${taskId} not found for editing.`);
    toast.add({
      title: "Task Not Found",
      description: "Could not find the task to edit.",
      icon: "i-heroicons-exclamation-triangle",
      color: "orange",
      timeout: 3000,
    });
  }
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  try {
    await updateTask(taskId, updatedData);
    showEditModal.value = false;
    editingTask.value = null; // Clear editing state
    toast.add({
      title: "Task saved!",
      icon: "i-heroicons-check-circle",
      color: "green",
    });
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to save task changes.";
    const detailedErrorMessage = err?.data?.message || errorMessage;
    console.error("Error saving task:", err);
    toast.add({
      title: "Error saving task",
      description: detailedErrorMessage,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

// Helper for formatting due date
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  // New Date() can handle ISO strings directly
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
</script>
