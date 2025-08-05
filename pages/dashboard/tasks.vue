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

    <div class="rounded-xl border border-slate-700 bg-slate-800">
      <div v-if="pending" class="flex justify-center p-12">
        <UiSpinner class="h-8 w-8 text-emerald-500" />
      </div>

      <div v-else-if="error" class="p-12 text-center">
        <p class="mb-4 text-rose-400">Failed to load tasks</p>
        <FormAppButton @click="() => refresh()" variant="secondary">
          Try Again
        </FormAppButton>
      </div>

      <div v-else class="p-4">
        <TaskList
          :tasks="tasks || []"
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
import { ref, type Ref } from "vue";
import { useTasks } from "~/composables/useTasks";
import type { ITask } from "~/types/task";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoMeta({
  title: "All Tasks - TaskForge",
});

const toast = useToast();
const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks();

const showCreateModal = ref(false);
const editingTask: Ref<ITask | null> = ref(null);

const handleTaskCreated = () => {
  showCreateModal.value = false;
  toast.add({ title: "Task created!", color: "green" });
};

const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => {
  await updateTask(taskId, updates);
  toast.add({ title: "Task updated!", color: "green" });
};

const handleTaskDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) return;
  await deleteTask(taskId);
  toast.add({ title: "Task deleted!", color: "orange" });
};

const handleEditTask = (taskId: string) => {
  // FIX: Find by 'id' instead of '_id'
  const foundTask = tasks.value?.find((t) => t.id === taskId);
  if (foundTask) {
    editingTask.value = foundTask;
  }
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  await updateTask(taskId, updatedData);
  editingTask.value = null;
  toast.add({ title: "Task saved!", color: "green" });
};
</script>