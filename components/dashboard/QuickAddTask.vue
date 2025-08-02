<!-- components/dashboard/QuickAddTask.vue -->
<template>
  <div class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Add a New Task</h3>
    <form @submit.prevent="addTask" class="space-y-4">
      <FormAppInput v-model="newTaskTitle" placeholder="Task title" required />
      <FormAppInput v-model="newTaskDescription" placeholder="Description (optional)" />
      <div class="flex justify-end space-x-2">
        <FormAppButton type="button" @click="$emit('close')" class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</FormAppButton>
        <FormAppButton type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white">Add Task</FormAppButton>
      </div>
    </form>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const emit = defineEmits(['close', 'task-added']);
const newTaskTitle = ref('');
const newTaskDescription = ref('');

const addTask = () => {
  if (newTaskTitle.value.trim()) {
    emit('task-added', { title: newTaskTitle.value, description: newTaskDescription.value });
    newTaskTitle.value = '';
    newTaskDescription.value = '';
  }
};
</script>