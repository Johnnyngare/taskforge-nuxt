<!-- pages/dashboard/tasks/index.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold text-white">All Tasks</h1>
        <p class="mt-1 text-slate-400">View and manage all your tasks.</p>
      </div>
      <div class="flex gap-3">
        <FormAppButton @click="showQuickAdd = true" class="flex items-center gap-2">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          Add Task
        </FormAppButton>
      </div>
    </div>

    <!-- Task List Card -->
    <div class="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-md">
      <h2 class="mb-6 text-xl font-semibold text-slate-200">Task List</h2>

      <div v-if="pending" class="flex justify-center py-8">
        <UiSpinner class="h-6 w-6 text-emerald-500" />
      </div>

      <div v-else-if="error" class="py-8 text-center">
        <p class="mb-4 text-rose-400">Failed to load tasks</p>
        <FormAppButton @click="refresh" variant="secondary">Try Again</FormAppButton>
      </div>

      <TaskList
        v-else-if="tasks && tasks.length > 0"
        :tasks="tasks"
        @task-updated="handleTaskUpdate"
        @task-deleted="handleTaskDelete"
        @edit-task="handleEditTask"
      />
      <div v-else class="py-8 text-center text-slate-400">
        <p>No tasks found. Click "Add Task" to create your first one!</p>
      </div>
    </div>

    <!-- Modals -->
    <DashboardQuickAddTask
      v-if="showQuickAdd"
      @task-created="handleTaskCreated"
      @close="showQuickAdd = false"
    />

    <TaskEditModal
      v-if="editingTask"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="editingTask = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted } from "vue";
import { useTasks } from "~/composables/useTasks";
import { type ITask } from "~/types/task";

definePageMeta({
  layout: "dashboard",
  middleware: "02-auth", // FIX: Changed from "auth" to "02-auth"
});

useSeoMeta({
  title: "All Tasks - TaskForge",
  description: "View and manage all your tasks.",
});

const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks();
const toast = useToast();

const showQuickAdd: Ref<boolean> = ref(false);
const editingTask: Ref<ITask | null> = ref(null);

onMounted(() => {
  console.log("All Tasks page mounted. Calling useTasks.refresh().");
  refresh();
});

const handleTaskCreated = () => {
  showQuickAdd.value = false;
  refresh();
  toast.add({
    title: "Task created!",
    icon: "i-heroicons-check-circle",
    color: "green",
  });
};

const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => {
  try {
    await updateTask(taskId, updates);
    refresh();
    toast.add({
      title: "Task updated!",
      icon: "i-heroicons-check-circle",
      color: "green",
    });
  } catch (err: unknown) {
    toast.add({
      title: "Error updating task",
      description: (err as any).data?.message || "An unexpected error occurred.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const handleTaskDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await deleteTask(taskId);
    refresh();
    toast.add({
      title: "Task deleted!",
      icon: "i-heroicons-trash",
      color: "orange",
    });
  } catch (err: unknown) {
    toast.add({
      title: "Error deleting task",
      description: (err as any).data?.message || "An unexpected error occurred.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const handleEditTask = (taskId: string) => {
  const foundTask = Array.isArray(tasks.value) ? tasks.value.find((t: ITask) => t.id === taskId) : undefined;
  if (foundTask) {
    editingTask.value = foundTask;
  }
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  try {
    await updateTask(taskId, updatedData);
    editingTask.value = null;
    refresh();
    toast.add({
      title: "Task saved!",
      icon: "i-heroicons-check-circle",
      color: "green",
    });
  } catch (err: unknown) {
    toast.add({
      title: "Error saving task",
      description: (err as any).data?.message || "An unexpected error occurred.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
};

const formatDate = (dateString?: string) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
</script>