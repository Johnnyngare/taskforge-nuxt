<!-- components/dashboard/ProjectOverview.vue -->
<template>
  <div class="project-overview-card">
    <h3>Project Overview</h3>
    <ul>
      <li v-for="project in projects" :key="project._id">
        <span>{{ project.name }}</span>
        <span>{{ project.completionRate.toFixed(0) }}%</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
const { projects, fetchProjects } = useProjects();

onMounted(() => {
  fetchProjects();
});
</script>
