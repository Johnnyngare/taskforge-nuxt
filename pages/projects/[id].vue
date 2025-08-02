<!-- pages/projects/[id].vue -->
<template>
  <div>
    <h1>Tasks for {{ project?.name }}</h1>
    <div v-if="pending">Loading tasks...</div>
    <ul v-else>
      <li v-for="task in tasks" :key="task._id">{{ task.title }}</li>
    </ul>
  </div>
</template>

<script setup>
const route = useRoute();
const projectId = route.params.id;

// Fetch tasks for this specific project
const { data: tasks, pending } = await useFetch(
  `/api/projects/${projectId}/tasks`
);

// Optional: Fetch project details to display the name
const { data: project } = await useFetch(`/api/projects/${projectId}`);
</script>
