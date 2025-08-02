<!-- pages/tasks/[id].vue -->
<template>
  <div>
    <h1>Viewing Task ID: {{ $route.params.id }}</h1>
    <!-- Details for a single task will go here -->
  </div>
</template>

<script setup>
// This tells Nuxt to run the 'auth' middleware before rendering this page
definePageMeta({
  middleware: "auth",
});

const route = useRoute();
// You can use route.params.id to fetch the specific task data
console.log("Task ID:", route.params.id);
</script>
