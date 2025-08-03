<template>
  <div class="p-6">
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Projects</h1>
          <p class="text-slate-400">Organize your tasks into projects</p>
        </div>
        <button
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>New Project</span>
        </button>
      </div>
    </div>

    <!-- Project Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Sample project cards -->
      <div
        class="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span class="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded"
            >3 tasks</span
          >
        </div>
        <h3
          class="text-white font-semibold mb-2 group-hover:text-emerald-400 transition-colors"
        >
          Sample Project
        </h3>
        <p class="text-slate-400 text-sm mb-4">
          Project management and task organization
        </p>
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-slate-400">Progress</span>
          <span class="text-emerald-400 font-medium">67%</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div
            class="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style="width: 67%"
          ></div>
        </div>
      </div>

      <!-- Add project card -->
      <div
        class="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl p-6 flex items-center justify-center hover:border-emerald-500 transition-colors cursor-pointer group"
      >
        <div class="text-center">
          <svg
            class="w-12 h-12 text-slate-500 mx-auto mb-3 group-hover:text-emerald-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p
            class="text-slate-400 group-hover:text-emerald-400 transition-colors"
          >
            Create New Project
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>
