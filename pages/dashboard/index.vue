<!-- pages/dashboard/index.vue -->
<template>
  <div>
    <!-- Welcome Banner -->
    <div
      class="mb-6 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
    >
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Welcome back, {{ authUser?.name || "TaskForge User" }}!
      </h1>
      <p class="text-gray-600 dark:text-slate-400">
        You have {{ tasks?.length || 0 }} tasks to manage today.
      </p>
    </div>

    <!-- Action Row -->
    <div
      class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div class="flex flex-wrap gap-3">
        <!-- UPDATED: Using UButton -->
        <UButton @click="openQuickAddModal" icon="i-heroicons-plus">
          Add Task
        </UButton>
      </div>
      <div class="text-sm text-gray-600 dark:text-slate-400">
        {{ tasks?.length || 0 }}
        {{ (tasks?.length || 0) === 1 ? "task" : "tasks" }} total
      </div>
    </div>

    <!-- Quick Add Modal (Using DashboardQuickAddTask component inside a UModal) -->
    <!-- The v-model on UModal makes it easy to control visibility -->
    <UModal v-model="showQuickAdd" prevent-close>
      <DashboardQuickAddTask
        @task-created="handleTaskCreated"
        @close="showQuickAdd = false"
      />
    </UModal>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 gap-6 lg:col-span-3 lg:grid-cols-3">
      <!-- Recent Tasks -->
      <div class="lg:col-span-2">
        <UCard class="shadow-md">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Tasks
            </h2>
            <NuxtLink
              to="/dashboard/tasks"
              class="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              View All
            </NuxtLink>
          </div>

          <div v-if="pending" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="h-6 w-6 animate-spin text-emerald-500" />
            <p class="ml-2 text-emerald-500">Loading tasks...</p>
          </div>

          <div v-else-if="error" class="py-8 text-center">
            <p class="mb-4 text-red-500 dark:text-red-400">
              Failed to load tasks
            </p>
            <UButton @click="refresh" variant="secondary"> Try Again </UButton>
          </div>

          <!-- TaskList (assuming this is updated to use UCard/UBadge etc. if needed) -->
          <TaskList
            v-else
            :tasks="Array.isArray(tasks) ? tasks.slice(0, 6) : []"
            :selected-task-id="editingTask?.id || selectedTaskId"
            @task-updated="handleTaskUpdate"
            @task-deleted="handleTaskDelete"
            @edit-task="handleEditTask"
            @task-selected="handleTaskSelect"
          />
        </UCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Field Task Map with a template ref -->
        <DashboardFieldTasksMap ref="fieldMapRef" :tasks="tasks" />

        <!-- Productivity Stats -->
        <UCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Productivity Stats
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-slate-400">Completed</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">
                {{ completedTasksCount }}/{{ tasks?.length || 0 }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-slate-400">Pending</span>
              <span class="font-semibold text-yellow-600 dark:text-yellow-400">{{
                pendingTasksCount
              }}</span>
            </div>
          </div>
        </UCard>

        <!-- Upcoming Deadlines -->
        <UCard>
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Deadlines
          </h3>
          <div v-if="upcomingTasks.length === 0" class="text-sm text-gray-600 dark:text-slate-400">
            No upcoming deadlines
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="task in upcomingTasks.slice(0, 3)"
              :key="task.id"
              class="text-sm"
            >
              <div class="text-gray-800 dark:text-slate-300">{{ task.title }}</div>
              <div class="text-gray-500 dark:text-slate-500">
                {{ formatDate(task.dueDate) }}
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Edit Modal -->
    <!-- UModal now uses v-model. editingTask is the object, showTaskEditModal controls visibility -->
    <TaskEditModal
      v-model="showTaskEditModal"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="closeTaskEditModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'; // Added nextTick
import { useTasks } from '~/composables/useTasks';
import { useAuth } from '~/composables/useAuth';
import { type ITask, TaskStatus, TaskType } from '~/types/task';
import { useAppToast } from '~/composables/useAppToast'; // CORRECTED: Use useAppToast
import DashboardFieldTasksMap from '~/components/dashboard/DashboardFieldTasksMap.vue';
import DashboardQuickAddTask from '~/components/dashboard/QuickAddTask.vue';
import TaskEditModal from '~/components/TaskEditModal.vue';

definePageMeta({
  layout: 'dashboard',
});

useSeoMeta({
  title: 'Dashboard - TaskForge',
  description: 'Manage your tasks and projects efficiently.',
});

const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks(); // Added updateTask, deleteTask
const { user: authUser } = useAuth(); // isAuthenticated is usually sufficient
const toast = useAppToast(); // CORRECTED: Use useAppToast

const showQuickAdd = ref(false);
const editingTask = ref<ITask | null>(null);
const showTaskEditModal = ref(false); // Controls visibility of TaskEditModal
const fieldMapRef = ref<InstanceType<typeof DashboardFieldTasksMap> | null>(null);
const selectedTaskId = ref<string | null>(null); // State to track selected task ID


const openQuickAddModal = () => {
  showQuickAdd.value = true;
  selectedTaskId.value = null; // Clear any task selection when opening quick add
};

const handleTaskSelect = (task: ITask) => {
  selectedTaskId.value = task.id; // Keep track of the selected task

  // If a field task, trigger map focus and invalidateSize
  if (task.taskType === TaskType.Field && fieldMapRef.value) {
    fieldMapRef.value.focusOnTask(task);
    // CRITICAL: Call invalidateSize() on the map *after* focusing
    // The focusOnTask should ideally call triggerInvalidateSize internally
    // or you can call it here if DashboardFieldTasksMap exposes it.
    // Assuming `focusOnTask` in DashboardFieldTasksMap already handles it or we pass a trigger.
    // For safety, let's explicitly trigger invalidateSize from here.
    nextTick(() => {
      fieldMapRef.value?.triggerInvalidateSize();
    });
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
  showQuickAdd.value = false; // Close the quick add modal
  selectedTaskId.value = null;
  refresh(); // Refresh tasks list
  toast.add({
    title: 'Task Added!',
    description: 'Your new task has been successfully created.',
    color: 'green',
    icon: 'i-heroicons-check-circle',
  });
};

const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => {
  try {
    await updateTask(taskId, updates);
    toast.add({
      title: 'Task Updated',
      description: 'Changes saved successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });
    refresh();
  } catch (err: any) {
    console.error('Failed to update task:', err);
    toast.add({
      title: 'Update Failed',
      description: err.data?.message || 'Could not save changes.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
};

const handleTaskDelete = async (taskId: string) => {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      await deleteTask(taskId);
      toast.add({
        title: 'Task Deleted',
        description: 'Task removed successfully.',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      });
      selectedTaskId.value = null; // Clear selection
      refresh();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      toast.add({
        title: 'Deletion Failed',
        description: err.data?.message || 'Could not delete task.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
    }
  }
};

const handleEditTask = (taskToEdit: ITask) => {
  editingTask.value = taskToEdit;
  showTaskEditModal.value = true; // Open the modal
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  try {
    await updateTask(taskId, updatedData);
    toast.add({
      title: 'Task Saved',
      description: 'Task updated successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });
    closeTaskEditModal();
    refresh();
  } catch (err: any) {
    console.error('Failed to save task edit:', err);
    toast.add({
      title: 'Save Failed',
      description: err.data?.message || 'Could not save task changes.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
};

const closeTaskEditModal = () => {
  editingTask.value = null; // Clear the task being edited
  showTaskEditModal.value = false; // Close the modal
  selectedTaskId.value = null; // Clear selection on modal close
};


const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>