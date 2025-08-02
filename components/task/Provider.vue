<!-- file: components/task/Provider.vue -->
<script setup>
import { computed } from "vue";
// Ensure useTasks is imported if it's not directly in `composables/`
// import { useTasks } from '~/composables/useTasks';

// Await the composable call
const { data: tasks, pending, error, refreshData } = await useTasks();

const pendingTasksCount = computed(() => {
  return tasks.value ? tasks.value.filter((task) => !task.completed).length : 0;
});

const handleTaskAdded = async () => {
  await refreshData(); // Use the renamed refreshData
};
const handleTaskUpdated = async () => {
  await refreshData();
};
const handleTaskDeleted = async () => {
  await refreshData();
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
  ></slot>
</template>
