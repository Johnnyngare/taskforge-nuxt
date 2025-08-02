<!-- file: components/task/Provider.vue -->
<script setup>
import { computed } from "vue";
// Ensure useTasks is imported if it's not directly in `composables/`
// For example:
// import { useTasks } from '~/composables/useTasks'; // UNCOMMENT THIS IF YOU GET "useTasks not defined"

// THE FIX: REMOVE 'await' here! useTasks is not an async function (or shouldn't be for this usage).
// Also, ensure destructuring is correct as 'useTasks' returns 'tasks', not 'data'.
const { tasks, pending, error, refresh, createTask, updateTask, deleteTask } = useTasks();

// Corrected pendingTasksCount computed property
const pendingTasksCount = computed(() => {
  // tasks.value should already be [] due to default: () => [] in useTasks.ts
  // The ?. is good for safety if you later remove the default, but not strictly needed now.
  return tasks.value?.filter((task) => !task.completed).length || 0;
});

// Rename these handlers for consistency and to use the methods from the composable
const handleTaskAdded = async (newTask) => { // Accept newTask if QuickAddTask passes it
  await createTask(newTask); // Call the composable's createTask method
  // `refresh()` inside createTask already handles the data update
};

const handleTaskUpdated = async (payload) => { // Accept payload for updates
  await updateTask(payload.taskId, payload.updates); // Call the composable's updateTask method
};

const handleTaskDeleted = async (taskId) => { // Accept taskId for deletion
  await deleteTask(taskId); // Call the composable's deleteTask method
};
</script>

<template>
  <slot
    :tasks="tasks"
    :loading="pending"
    :error="error"
    :pendingTasksCount="pendingTasksCount"
    :onTaskAdded="handleTaskAdded"
    :onTaskUpdated="handleTaskUpdated"
    :onTaskDeleted="handleTaskDeleted"
    :refreshTasks="refresh" <!-- Pass refresh if other components need it directly -->
  ></slot>
</template>