<!-- pages/dashboard/index.vue -->
<template>
  <div>
    <!-- Welcome Banner -->
    <div
      class="mb-6 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-6"
    >
      <h1 class="mb-2 text-2xl font-bold text-white">
        Welcome back, {{ authUser?.name || "TaskForge User" }}!
      </h1>
      <p class="text-slate-400">
        You have {{ tasks?.length || 0 }} tasks to manage today.
      </p>
    </div>

    <!-- Action Row -->
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

    <!-- Quick Add -->
    <DashboardQuickAddTask
      v-if="showQuickAdd"
      @task-created="handleTaskCreated"
      @close="showQuickAdd = false"
    />

    <!-- Main Grid -->
    <div class="grid grid-cols-1 gap-6 lg:col-span-3 lg:grid-cols-3">
      <!-- Recent Tasks -->
      <div class="lg:col-span-2">
        <div class="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-md">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-200">Recent Tasks</h2>
            <NuxtLink
              to="/dashboard/tasks"
              class="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              View All
            </NuxtLink>
          </div>

          <div v-if="pending" class="flex justify-center py-8">
            <UiSpinner class="h-6 w-6 text-emerald-500" />
            <p class="ml-2 text-emerald-500">Loading tasks...</p>
          </div>

          <div v-else-if="error" class="py-8 text-center">
            <p class="mb-4 text-rose-400">Failed to load tasks</p>
            <FormAppButton @click="refresh" variant="secondary">
              Try Again
            </FormAppButton>
          </div>

          <TaskList
            v-else
            :tasks="Array.isArray(tasks) ? tasks.slice(0, 6) : []"
            :selected-task-id="selectedTaskId"
            @task-updated="handleTaskUpdate"
            @task-deleted="handleTaskDelete"
            @edit-task="handleEditTask"
            @task-selected="handleTaskSelect"
          />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Field Task Map with a template ref -->
        <DashboardFieldTasksMap ref="fieldMapRef" :tasks="tasks" />

        <!-- Productivity Stats -->
        <div class="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h3 class="mb-4 text-lg font-semibold text-slate-200">
            Productivity Stats
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-400">Completed</span>
              <span class="font-semibold text-emerald-400">
                {{ completedTasksCount }}/{{ tasks?.length || 0 }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Pending</span>
              <span class="font-semibold text-yellow-400">{{
                pendingTasksCount
              }}</span>
            </div>
          </div>
        </div>

        <!-- Upcoming Deadlines -->
        <div class="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h3 class="mb-4 text-lg font-semibold text-slate-200">
            Upcoming Deadlines
          </h3>
          <div v-if="upcomingTasks.length === 0" class="text-sm text-slate-400">
            No upcoming deadlines
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="task in upcomingTasks.slice(0, 3)"
              :key="task.id"
              class="text-sm"
            >
              <div class="text-slate-300">{{ task.title }}</div>
              <div class="text-slate-500">
                {{ formatDate(task.dueDate) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <TaskEditModal
      v-if="editingTask"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="editingTask = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from "vue";
import { useTasks } from "~/composables/useTasks";
import { useAuth } from "~/composables/useAuth";
import { type ITask, TaskStatus, TaskType } from "~/types/task";
import { useToast } from 'vue-toastification';
import { useCookie } from '#app';

import DashboardFieldTasksMap from '~/components/dashboard/DashboardFieldTasksMap.vue';
import DashboardQuickAddTask from '~/components/dashboard/QuickAddTask.vue';
import TaskEditModal from '~/components/TaskEditModal.vue';

definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "Dashboard - TaskForge",
  description: "Manage your tasks and projects efficiently.",
});

const { tasks, pending, error, refresh } = useTasks();
const { user: authUser, isAuthenticated } = useAuth(); // REMOVED 'initialized'

// REMOVED old complex watch statement for tasks. useTasks handles it now.
// watch([isAuthenticated, initialized, () => authUser.value?.id, authTokenCookie], ([isAuth, isInit, userId, token]) => { /* ... */ });

const showQuickAdd: Ref<boolean> = ref(false);
const editingTask: Ref<ITask | null> = ref(null);
const fieldMapRef = ref(null); // Template ref for the map component
const selectedTaskId = ref<string | null>(null); // State to track selected task ID


const handleTaskSelect = (task: ITask) => {
  if (task.taskType === TaskType.Field && fieldMapRef.value) {
    // Cast to any because type inference on ref.value might be too strict
    (fieldMapRef.value as any).focusOnTask(task);
    selectedTaskId.value = task.id;
  }
};

const completedTasksCount = computed(() =>
  Array.isArray(tasks.value)
    ? tasks.value.filter((task: ITask) => task.status === TaskStatus.Completed).length
    : 0
);

const pendingTasksCount = computed(() =>
  Array.isArray(tasks.value)
    ? tasks.value.filter((task: ITask) => task.status === TaskStatus.Pending).length
    : 0
);

const upcomingTasks = computed(() => {
  if (!Array.isArray(tasks.value)) return [];
  const now = new Date();
  return tasks.value
    .filter((task: ITask) => task.dueDate && new Date(task.dueDate) > now)
    .sort((a: ITask, b: ITask) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
});

const handleTaskCreated = () => {
  showQuickAdd.value = false;
  selectedTaskId.value = null; // Clear selection on refresh
  refresh();
  // If you want a toast here, it should be done manually:
  // toast.success("Task created successfully!");
};

// ... (other handleTaskUpdate, handleTaskDelete, handleEditTask, handleSaveEdit, formatDate functions)
// These functions remain unchanged.
const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => { /* ... */ };
const handleTaskDelete = async (taskId: string) => { /* ... */ };
const handleEditTask = (taskId: string) => { /* ... */ };
const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => { /* ... */ };
const formatDate = (dateString?: string) => { /* ... */ };
</script>