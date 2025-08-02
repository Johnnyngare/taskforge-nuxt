<!-- components/dashboard/QuickAddTask.vue -->
<template>
  <div class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Add a New Task</h3>
    <form @submit.prevent="addTask" class="space-y-4">
      <FormAppInput v-model="newTaskTitle" placeholder="Task title" required />
      <FormAppInput v-model="newTaskDescription" placeholder="Description (optional)" />

      <!-- New: Project Selector -->
      <div v-if="projects && projects.length > 0">
        <label for="project-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Project (Optional)</label>
        <select
          id="project-select"
          v-model="selectedProjectId"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        >
          <option :value="null">-- No Project --</option> <!-- Option for standalone task -->
          <option v-for="project in projects" :key="project._id" :value="project._id">
            {{ project.name }}
          </option>
        </select>
      </div>
      <p v-else-if="!projectsLoading" class="text-sm text-gray-500 dark:text-gray-400">No projects available. Create one first!</p>
      <UiSpinner v-else size="sm" class="my-2" /> <!-- Show spinner if projects are loading -->


      <div class="flex justify-end space-x-2">
        <FormAppButton type="button" @click="$emit('close')" class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</FormAppButton>
        <FormAppButton type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white">Add Task</FormAppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  // Accept projects list as a prop
  projects: {
    type: Array,
    default: () => [],
  },
  // Indicate if projects are still loading
  projectsLoading: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['close', 'task-added']);
const newTaskTitle = ref('');
const newTaskDescription = ref('');
const selectedProjectId = ref(null); // Local ref to hold selected project ID, defaults to null (no project)

const addTask = () => {
  if (newTaskTitle.value.trim()) {
    const taskPayload = {
      title: newTaskTitle.value,
      description: newTaskDescription.value,
      // Conditionally include projectId only if a project is selected (i.e., selectedProjectId is not null)
      ...(selectedProjectId.value && { projectId: selectedProjectId.value }),
      // Default status to 'pending' as per TaskModel
      status: 'pending',
      // You might add default dueDate here or let backend handle it
    };
    emit('task-added', taskPayload); // Emit the full payload
    newTaskTitle.value = '';
    newTaskDescription.value = '';
    selectedProjectId.value = null; // Reset selection
  }
};
</script>