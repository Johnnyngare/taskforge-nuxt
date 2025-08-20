<!-- pages/dashboard/admin/index.vue -->
<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
      <p class="text-slate-400">Manage users and system settings from here.</p>
    </div>

    <div class="rounded-xl border border-slate-700 bg-slate-800 p-6">
      <h2 class="mb-4 text-lg font-semibold text-white">User Management</h2>
      <p class="text-slate-400">
        This section is protected and only visible to users with the 'Admin'
        role. A user list and role management features would be built out here.
      </p>
      <!-- Example: You would fetch and list users here -->
    </div>
  </div>
</template>

<script setup lang="ts">
// IMPORTANT: Make sure the middleware file name matches this string.
// If your file is `server/middleware/02.auth.ts` then keep "02.auth".
// If you rename it to `auth.ts`, then use "auth".
definePageMeta({
  layout: 'dashboard',
  middleware: ['admin']
})

useSeoMeta({
  title: 'Admin Panel - TaskForge'
})
</script>
