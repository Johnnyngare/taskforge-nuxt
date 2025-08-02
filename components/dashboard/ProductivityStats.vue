<!-- file: components/dashboard/ProductivityStats.vue -->
<template>
  <div
    class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4"
  >
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Productivity Stats
    </h2>
    <div class="space-y-4">
      <!-- Tasks Completed this Week -->
      <div>
        <div
          class="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300"
        >
          <span>Tasks Completed this Week</span>
          <span class="font-medium"
            >{{ completedTasksThisWeek }}/{{ totalTasksThisWeek }}</span
          >
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            class="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${completionPercentageThisWeek}%` }"
          ></div>
        </div>
      </div>

      <!-- Quick Stat Cards -->
      <div class="grid grid-cols-2 gap-4 text-center">
        <!-- These stats should ideally also be derived from `props.tasks` if possible -->
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ overdueTasksCount }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300">Overdue Tasks</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ activeProjectsCount }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Projects Active
          </p>
        </div>
      </div>

      <!-- Placeholder for a simple chart -->
      <div class="mt-4">
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
          Weekly Task Trends
        </p>
        <div
          class="bg-gray-100 dark:bg-gray-700 h-32 rounded-lg flex items-center justify-center text-gray-400 text-xs"
        >
          [Chart Placeholder]
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"; // 'ref' is no longer needed here as data comes from props

// 1. Define the 'tasks' prop that is passed from the dashboard page via TaskProvider.
const props = defineProps({
  tasks: {
    type: Array,
    default: () => [], // Provide an empty array as default to prevent errors if not passed
  },
});

// Helper to get the start of the current week (e.g., Sunday or Monday)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // Sunday - 0, Monday - 1
  // Adjusted logic to always start week on Monday (1)
  // If your week starts on Sunday (0), use `const diff = d.getDate() - day;`
  const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// 2. Update all computed properties to use props.tasks
const completedTasksThisWeek = computed(() => {
  // Always add a guard against props.tasks being null/undefined initially
  if (!props.tasks || props.tasks.length === 0) return 0;

  const startOfWeek = getStartOfWeek(new Date());
  return props.tasks.filter(
    (task) =>
      task.completed &&
      task.completedDate && // Ensure completedDate exists
      new Date(task.completedDate) >= startOfWeek
  ).length;
});

const totalTasksThisWeek = computed(() => {
  // If you want total tasks *this week*, you'd filter more here.
  // For simplicity, this currently counts all tasks in the passed array.
  if (!props.tasks) return 0;
  return props.tasks.length;
});

const completionPercentageThisWeek = computed(() => {
  if (totalTasksThisWeek.value === 0) return 0;
  return Math.round(
    (completedTasksThisWeek.value / totalTasksThisWeek.value) * 100
  );
});

// New computed properties for other stats (derived from props.tasks)
const overdueTasksCount = computed(() => {
  if (!props.tasks) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  return props.tasks.filter(
    (task) => !task.completed && task.dueDate && new Date(task.dueDate) < today
  ).length;
});

const activeProjectsCount = computed(() => {
  if (!props.tasks) return 0;
  // This is a simplistic way; ideally, projects would be their own data.
  // Counts unique project names from incomplete tasks.
  const projects = new Set();
  props.tasks.forEach((task) => {
    if (!task.completed && task.project) {
      projects.add(task.project);
    }
  });
  return projects.size;
});
</script>
