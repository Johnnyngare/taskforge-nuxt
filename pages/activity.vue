<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-2">Activity Feed</h1>
      <p class="text-slate-400">Track your recent actions and updates</p>
    </div>

    <div
      class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
    >
      <!-- Activity Feed Header -->
      <div class="p-4 border-b border-slate-700">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">Recent Activity</h2>
          <div class="flex items-center space-x-2">
            <button
              class="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm"
            >
              All
            </button>
            <button
              class="px-3 py-1 text-slate-400 hover:bg-slate-700 rounded text-sm transition-colors"
            >
              Tasks
            </button>
            <button
              class="px-3 py-1 text-slate-400 hover:bg-slate-700 rounded text-sm transition-colors"
            >
              Projects
            </button>
          </div>
        </div>
      </div>

      <!-- Activity List -->
      <div class="p-4">
        <div class="text-center py-12">
          <svg
            class="w-16 h-16 text-slate-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 class="text-xl font-semibold text-white mb-2">
            Activity Feed Coming Soon
          </h3>
          <p class="text-slate-400">
            We're working on bringing you a comprehensive activity tracking
            system.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "02-auth",
  layout: "dashboard",
});
</script>
