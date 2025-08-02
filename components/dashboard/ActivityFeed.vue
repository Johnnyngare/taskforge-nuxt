<!-- file: components/dashboard/ActivityFeed.vue -->
<template>
  <div
    class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4"
  >
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Recent Activity
    </h2>
    <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
      <li>
        <span class="font-medium text-emerald-600 dark:text-emerald-400"
          >You</span
        >
        completed "Prepare presentation"
      </li>
      <li>
        <span class="font-medium text-blue-600 dark:text-blue-400">John</span>
        added "Update user guide"
      </li>
      <li>
        <span class="font-medium text-orange-600 dark:text-orange-400"
          >You</span
        >
        commented on "Bug Fixes"
      </li>
      <li>
        <span class="font-medium text-purple-600 dark:text-purple-400"
          >Sarah</span
        >
        updated "Marketing Strategy" due date
      </li>
    </ul>
    <div class="mt-4 text-right">
      <NuxtLink to="/activity" class="text-emerald-600 hover:underline text-sm"
        >View all activity</NuxtLink
      >
    </div>
  </div>
</template>

<script setup>
// No specific logic needed for a basic activity feed component
</script>
