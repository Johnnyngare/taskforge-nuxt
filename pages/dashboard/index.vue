<!-- pages/dashboard/index.vue -->
<template>
  <div>
    <div
      class="mb-6 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-6"
    >
      <h1 class="mb-2 text-2xl font-bold text-white">
        Welcome back, {{ user?.name || "TaskForge User" }}!
      </h1>
      <p class="text-slate-400">
        You have {{ tasks?.length || 0 }} tasks to manage today.
      </p>
    </div>

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

    <DashboardQuickAddTask
      v-if="showQuickAdd"
      @task-created="handleTaskCreated"
      @close="showQuickAdd = false"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

          <div v-if="pending" class="flex justify-center py-8">
            <UiSpinner class="h-6 w-6 text-emerald-500" />
          </div>

          <div v-else-if="error" class="py-8 text-center">
            <p class="mb-4 text-rose-400">Failed to load tasks</p>
            <FormAppButton @click="() => refresh()" variant="secondary">
              Try Again
            </FormAppButton>
          </div>

          <TaskList
            v-else
            :tasks="tasks ? tasks.slice(0, 6) : []"
            @task-updated="handleTaskUpdate"
            @task-deleted="handleTaskDelete"
            @edit-task="handleEditTask"
          />
        </div>
      </div>

      <div class="space-y-6">
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
import { type ITask, TaskStatus } from "~/types/task";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoMeta({
  title: "Dashboard - TaskForge",
  description: "Manage your tasks and projects efficiently.",
});

const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks();
const { user } = useAuth();
const toast = useToast();

const showQuickAdd = ref(false);
const editingTask: Ref<ITask | null> = ref(null);

const completedTasksCount = computed(
  () =>
    tasks.value?.filter((task) => task.status === TaskStatus.Completed)
      .length || 0
);

const pendingTasksCount = computed(
  () =>
    tasks.value?.filter((task) => task.status === TaskStatus.Pending).length ||
    0
);

const upcomingTasks = computed(() => {
  if (!tasks.value) return [];
  const now = new Date();
  return tasks.value
    .filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return !isNaN(dueDate.getTime()) && dueDate > now;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dueDate as string);
      const dateB = new Date(b.dueDate as string);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
      return dateA.getTime() - dateB.getTime();
    });
});

const handleTaskCreated = () => {
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
    toast.add({
      title: "Error updating task",
      description: err.data?.message || "An unexpected error occurred.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const handleTaskDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await deleteTask(taskId);
    toast.add({
      title: "Task deleted!",
      icon: "i-heroicons-trash",
      color: "orange",
    });
  } catch (err: any) {
    toast.add({
      title: "Error deleting task",
      description: err.data?.message || "An unexpected error occurred.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const handleEditTask = (taskId: string) => {
  // FIX: Find by 'id' instead of '_id'
  const foundTask = tasks.value?.find((t) => t.id === taskId);
  if (foundTask) {
    editingTask.value = foundTask;
  }
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  try {
    await updateTask(taskId, updatedData);
    editingTask.value = null;
    toast.add({
      title: "Task saved!",
      icon: "i-heroicons-check-circle",
      color: "green",
    });
  } catch (err: any) {
    toast.add({
      title: "Error saving task",
      description: err.data?.message || "An unexpected error occurred.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
</script>