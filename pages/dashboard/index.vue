<template>
  <div>
    <!-- Welcome Banner -->
    <div
      class="mb-6 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-6"
    >
      <h1 class="text-2xl font-bold text-white mb-2">Welcome back!</h1>
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

    <!-- Quick Add Task (Modal-like) -->
    <div v-if="showQuickAdd" class="mb-6">
      <DashboardQuickAddTask
        @task-created="handleTaskCreated"
        @close="showQuickAdd = false"
      />
    </div>

    <!-- Dashboard Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Task List -->
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

          <!-- Loading State -->
          <div v-if="pending" class="flex justify-center py-8">
            <UiSpinner class="h-6 w-6 text-emerald-500" />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="py-8 text-center">
            <p class="mb-4 text-rose-400">Failed to load tasks</p>
            <FormAppButton @click="refresh" variant="secondary">
              Try Again
            </FormAppButton>
          </div>

          <!-- Task List -->
          <div v-else>
            <div
              v-if="!tasks || tasks.length === 0"
              class="py-8 text-center text-slate-400"
            >
              <Icon
                name="heroicons:clipboard-document-list"
                class="mx-auto h-12 w-12 mb-4 opacity-50"
              />
              <p class="text-lg mb-2">No tasks yet</p>
              <p class="text-sm">Create your first task to get started!</p>
            </div>
            <TaskTaskList
              v-else
              :tasks="tasks.slice(0, 6)"
              @task-updated="handleTaskUpdate"
              @task-deleted="handleTaskDelete"
            />
          </div>
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
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useTasks } from "~/composables/useTasks";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoMeta({
  title: "Dashboard - TaskForge",
  description: "Manage your tasks and projects efficiently.",
});

const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks();

const showQuickAdd = ref(false);

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
    .filter((task) => task.dueDate && new Date(task.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
});

const handleTaskCreated = () => {
  showQuickAdd.value = false;
  refresh(); // Refresh the task list
};

const handleTaskUpdate = async (taskId, updates) => {
  try {
    await updateTask(taskId, updates);
  } catch (error) {
    console.error("Failed to update task:", error);
  }
};

const handleTaskDelete = async (taskId) => {
  try {
    await deleteTask(taskId);
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
</script>
