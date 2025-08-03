<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-2">Calendar</h1>
      <p class="text-slate-400">
        View your tasks and deadlines in calendar format
      </p>
    </div>

    <div
      class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
    >
      <!-- Calendar header -->
      <div class="p-4 border-b border-slate-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button class="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <svg
                class="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 class="text-xl font-semibold text-white">
              {{ currentMonth }} {{ currentYear }}
            </h2>
            <button class="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <svg
                class="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div class="flex items-center space-x-2">
            <button
              class="px-3 py-1 bg-emerald-600 text-white rounded text-sm font-medium"
            >
              Month
            </button>
            <button
              class="px-3 py-1 text-slate-400 hover:bg-slate-700 rounded text-sm transition-colors"
            >
              Week
            </button>
            <button
              class="px-3 py-1 text-slate-400 hover:bg-slate-700 rounded text-sm transition-colors"
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <!-- Calendar grid -->
      <div class="p-4">
        <div
          class="grid grid-cols-7 gap-px bg-slate-700 rounded-lg overflow-hidden"
        >
          <!-- Day headers -->
          <div
            v-for="day in dayHeaders"
            :key="day"
            class="bg-slate-800 p-3 text-center"
          >
            <span class="text-sm font-medium text-slate-400">{{ day }}</span>
          </div>

          <!-- Calendar days -->
          <div
            v-for="date in calendarDays"
            :key="date"
            class="bg-slate-800 p-3 min-h-[120px] hover:bg-slate-750 transition-colors"
          >
            <div class="text-sm text-slate-300 mb-2">{{ date }}</div>
            <!-- Sample task indicators -->
            <div v-if="date === 15" class="space-y-1">
              <div class="w-full h-1 bg-emerald-500 rounded"></div>
              <div class="text-xs text-emerald-400">Task due</div>
            </div>
            <div v-if="date === 20" class="space-y-1">
              <div class="w-full h-1 bg-red-500 rounded"></div>
              <div class="text-xs text-red-400">Overdue</div>
            </div>
            <div v-if="date === 8" class="space-y-1">
              <div class="w-full h-1 bg-blue-500 rounded"></div>
              <div class="text-xs text-blue-400">Meeting</div>
            </div>
          </div>
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

const currentMonth = "August";
const currentYear = 2025;
const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calendarDays = Array.from({ length: 35 }, (_, i) => i + 1); // Simplified for demo
</script>
