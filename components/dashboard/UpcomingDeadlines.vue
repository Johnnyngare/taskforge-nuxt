<!-- file: components/dashboard/UpcomingDeadlines.vue -->
<template>
  <div
    class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4"
  >
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Upcoming Deadlines
    </h2>
    <ul v-if="upcomingTasks.length > 0" class="space-y-3">
      <li
        v-for="task in upcomingTasks"
        :key="task.id"
        class="flex justify-between items-center text-sm"
      >
        <span
          :class="[
            'truncate',
            task.completed
              ? 'line-through text-gray-400'
              : 'text-gray-700 dark:text-gray-200',
          ]"
          >{{ task.title }}</span
        >
        <span :class="getDueDateClass(task.dueDate)">{{
          formatDate(task.dueDate)
        }}</span>
      </li>
    </ul>
    <div
      v-else
      class="text-center text-gray-500 dark:text-gray-400 text-sm py-4"
    >
      No upcoming deadlines! Good job.
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// 1. Define the 'tasks' prop to receive data from the parent.
const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
});

// 2. Create a computed property based on props.tasks.
const upcomingTasks = computed(() => {
  // THE FIX: Add a guard clause to ensure props.tasks exists.
  if (!props.tasks || props.tasks.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to the start of the day

  // Filter for non-completed tasks due in the next 7 days, sorted by due date.
  return props.tasks
    .filter((task) => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5); // Show the top 5 upcoming tasks
});

// Helper functions (no changes needed here, but they are good to have)
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDueDateClass = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "text-red-600 dark:text-red-400 font-semibold";
  if (diffDays === 0)
    return "text-orange-600 dark:text-orange-400 font-semibold";
  if (diffDays <= 3) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-500 dark:text-gray-400";
};
</script>
