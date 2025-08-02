<!-- file: components/project/Provider.vue -->
<script setup>
import { computed } from 'vue';

// Assuming you have a useProjects composable similar to useTasks
// Import useProjects if it's not automatically globally available
// import { useProjects } from '~/composables/useProjects';

// Fetch projects data using useProjects composable
const {
  projects, // Renamed from 'data' for clarity if useProjects returns 'data' as 'projects'
  pending: projectsLoading,
  error: projectsError,
  refresh: refreshProjects, // Method to refetch projects
  // Add other project-related functions from useProjects if they exist
  // e.g., createProject, updateProject, deleteProject
} = useProjects({
  // Optional: add any default options for useFetch here, e.g., default: () => []
  default: () => [],
});

// Any project-related computed properties or handlers could go here
// For example, if you need a count of active projects:
const activeProjectsCount = computed(() => {
  if (!projects.value) return 0;
  return projects.value.filter(p => p.status === 'Active').length;
});

const handleProjectCreated = async () => {
  await refreshProjects();
  // Optional: Emit an event if parent needs to know
}

// Expose relevant data and methods via the slot
</script>

<template>
  <slot
    :projects="projects"
    :loading="projectsLoading"
    :error="projectsError"
    :refreshProjects="refreshProjects"
    :activeProjectsCount="activeProjectsCount"
    :onProjectCreated="handleProjectCreated"
  >
    <!-- Fallback content if no slot content is provided -->
  </slot>
</template>