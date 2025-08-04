<template>
  <div
    class="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg"
  >
    <div
      class="flex flex-col items-start justify-between lg:flex-row lg:items-center"
    >
      <div class="mb-4 lg:mb-0">
        <h1 class="mb-2 text-2xl font-bold lg:text-3xl">
          {{ welcomeMessage }}
        </h1>
        <p class="text-lg text-blue-100">
          {{ motivationalMessage }}
        </p>
      </div>

      <div
        class="grid w-full grid-cols-2 gap-4 lg:w-auto lg:grid-cols-4 lg:gap-6"
      >
        <div class="text-center">
          <div class="mb-1 text-2xl font-bold lg:text-3xl">
            {{ totalTasks }}
          </div>
          <div class="text-sm font-medium text-blue-200">Total Tasks</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-2xl font-bold text-green-300 lg:text-3xl">
            {{ completedToday }}
          </div>
          <div class="text-sm font-medium text-blue-200">Completed</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-2xl font-bold text-yellow-300 lg:text-3xl">
            {{ dueToday }}
          </div>
          <div class="text-sm font-medium text-blue-200">Due Today</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-2xl font-bold text-red-300 lg:text-3xl">
            {{ overdue }}
          </div>
          <div class="text-sm font-medium text-blue-200">Overdue</div>
        </div>
      </div>
    </div>

    <div class="mt-6 border-t border-blue-500 pt-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium text-blue-100">Daily Progress</span>
        <span class="text-sm font-semibold text-white">
          {{ Math.round(dailyCompletionRate) }}%
        </span>
      </div>
      <div class="h-3 w-full rounded-full bg-blue-500">
        <div
          class="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 ease-out"
          :style="{ width: `${dailyCompletionRate}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tasks: { type: Array, default: () => [] },
});

const totalTasks = computed(() => props.tasks.length);

const isToday = (date) =>
  new Date(date).toDateString() === new Date().toDateString();

const completedToday = computed(
  () =>
    props.tasks.filter(
      (task) => task.status === "completed" && isToday(task.updatedAt)
    ).length
);

const dueToday = computed(
  () =>
    props.tasks.filter(
      (task) =>
        task.status !== "completed" && task.dueDate && isToday(task.dueDate)
    ).length
);

const overdue = computed(
  () =>
    props.tasks.filter(
      (task) =>
        task.status !== "completed" &&
        task.dueDate &&
        new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0)
    ).length
);

const totalTasksForToday = computed(
  () =>
    props.tasks.filter((task) => task.dueDate && isToday(task.dueDate)).length
);

const dailyCompletionRate = computed(() => {
  if (totalTasksForToday.value === 0) return 0;
  return (completedToday.value / totalTasksForToday.value) * 100;
});

const welcomeMessage = computed(() => {
  const hour = new Date().getHours();
  const name = "TaskForge User"; // Replace with actual user name from auth
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 18) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
});

const motivationalMessage = computed(() => {
  if (overdue.value > 0)
    return "You have some overdue tasks. Let's get them done!";
  if (dailyCompletionRate.value >= 75)
    return "You're crushing it today! Keep up the great work.";
  if (dailyCompletionRate.value >= 50)
    return "Great job staying on track with your tasks!";
  return "Ready to tackle your tasks? Let's make today productive!";
});
</script>
