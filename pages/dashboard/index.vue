<template>
  <!-- ... content ... -->
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from "vue";
import { useTasks } from "~/composables/useTasks";
import { useAuth } from "~/composables/useAuth";
import { type ITask, TaskStatus } from "~/types/task";
definePageMeta({
  layout: "dashboard",
  middleware: "02-auth", // FIX: Use '02.auth' route middleware
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