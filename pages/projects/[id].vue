<!-- pages/projects/[id].vue -->
<template>
  <div>
    <h1 v-if="project">{{ project.name }}</h1>
    <h1 v-else>Loading project...</h1>

    <div v-if="tasksPending">Loading tasks...</div>
    <ul v-else-if="tasks && tasks.length">
      <li v-for="task in tasks" :key="task._id">{{ task.title }}</li>
    </ul>
    <p v-else>No tasks found for this project.</p>
  </div>
</template>

<script setup>
const route = useRoute();
const projectId = route.params.id;

// Fetch project details
const { data: project, pending: projectPending, error: projectError } = await useAsyncData(
  `project-${projectId}`,
  () => $fetch(`/api/projects/${projectId}`)
);

// Fetch tasks for this project
const { data: tasks, pending: tasksPending, error: tasksError } = await useAsyncData(
  `tasks-${projectId}`,
  () => $fetch(`/api/projects/${projectId}/tasks`)
);

if (projectError) {
  console.error("Error fetching project:", projectError);
}
if (tasksError) {
  console.error("Error fetching tasks:", tasksError);
}
</script>
