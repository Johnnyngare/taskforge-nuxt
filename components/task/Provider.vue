<template>
  <div>
    <slot
      :tasks="tasks"
      :pending="pending"
      :error="error"
      :refresh="refresh"
      :create-task="createTask"
      :update-task="updateTask"
      :delete-task="deleteTask"
      :edit-task="editTask"
    />

    <!-- Edit Task Modal -->
    <TaskEditModal
      v-if="editingTask"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="cancelEdit"
    />
  </div>
</template>

<script setup>
import { ref, provide, readonly } from "vue";
import TaskEditModal from "~/components/task/TaskEditModal.vue"; // Explicit import for clarity

const { tasks, pending, error, refresh, createTask, updateTask, deleteTask } =
  useTasks();

const editingTask = ref(null);

const editTask = (taskId) => {
  const task = tasks.value.find((t) => t._id === taskId);
  if (task) {
    editingTask.value = { ...task }; // Create a copy for editing
  }
};

const handleSaveEdit = async (updates) => {
  if (!editingTask.value) return;
  try {
    await updateTask(editingTask.value._id, updates);
    editingTask.value = null;
    // Optionally show a success toast
  } catch (err) {
    console.error("Failed to update task:", err);
    // Optionally show an error toast
  }
};

const cancelEdit = () => {
  editingTask.value = null;
};

provide("taskProvider", {
  tasks: readonly(tasks),
  pending: readonly(pending),
  error: readonly(error),
  refresh,
  createTask,
  updateTask,
  deleteTask,
  editTask,
});
</script>
