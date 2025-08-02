<!-- components/dashboard/ProjectOverview.vue -->
<template>
  <div class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Overview</h2>
    <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
      <li class="flex justify-between items-center">
        <span>TaskForge Core</span>
        <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">80%</span>
      </li>
      <li class="flex justify-between items-center">
        <span>Mobile App</span>
        <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">45%</span>
      </li>
      <li class="flex justify-between items-center">
        <span>Marketing Site</span>
        <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">100%</span>
      </li>
    </ul>
    <div class="mt-4 text-right">
      <NuxtLink to="/projects" class="text-emerald-600 hover:underline text-sm">View all projects</NuxtLink>
    </div>
  </div>
</template>
<script setup>
// No specific logic needed for a basic project overview
</script>