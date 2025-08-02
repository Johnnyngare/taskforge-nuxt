<template>
  <div
    class="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-600/25"
  >
    <!-- Decorative background pattern -->
    <div class="absolute inset-0 bg-black/5">
      <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
    </div>

    <!-- Floating decorative elements -->
    <div
      class="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"
    ></div>

    <!-- Content -->
    <div class="relative px-8 py-8 sm:px-12 sm:py-10">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-3">
            <div class="flex-shrink-0">
              <div
                class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-white">
                Welcome Back, {{ userName }}!
              </h1>
              <div class="flex items-center space-x-2 mt-1">
                <div
                  class="w-2 h-2 bg-green-300 rounded-full animate-pulse"
                ></div>
                <span class="text-emerald-100 text-sm"
                  >Ready to be productive</span
                >
              </div>
            </div>
          </div>

          <p class="text-emerald-50 text-lg leading-relaxed max-w-2xl">
            {{ welcomeMessage }}
          </p>
        </div>

        <!-- Quick stats -->
        <div class="mt-6 sm:mt-0 sm:ml-8 flex-shrink-0">
          <div class="flex space-x-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-white">
                {{ todayTasksCount }}
              </div>
              <div class="text-emerald-100 text-sm">Due Today</div>
            </div>
            <div class="w-px bg-white/20"></div>
            <div class="text-center">
              <div class="text-2xl font-bold text-white">
                {{ overdueTasksCount }}
              </div>
              <div class="text-emerald-100 text-sm">Overdue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 1. Define the 'tasks' prop to receive data from the parent (TaskProvider).
const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
});

// 2. Keep useAuth() as it's for user-specific data, not task data.
const { user } = useAuth();

// 3. REMOVE the redundant useTasks() call.
// const { tasks } = useTasks(); // This is no longer needed.

// Computed properties
const userName = computed(() => user.value?.name || "User");

// 4. Update computed properties to use props.tasks instead of a local 'tasks' ref.
const todayTasksCount = computed(() => {
  if (!props.tasks) return 0; // Guard clause for safety
  const today = new Date().toDateString();
  return props.tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      new Date(task.dueDate).toDateString() === today
  ).length;
});

const overdueTasksCount = computed(() => {
  if (!props.tasks) return 0; // Guard clause for safety
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to the beginning of the day for accurate comparison
  return props.tasks.filter(
    (task) => !task.completed && task.dueDate && new Date(task.dueDate) < today
  ).length;
});

const welcomeMessage = computed(() => {
  const totalDue = todayTasksCount.value + overdueTasksCount.value;
  if (totalDue === 0) {
    return "Great job! You're all caught up. Time to tackle some new challenges.";
  } else if (overdueTasksCount.value > 0) {
    return `You have ${todayTasksCount.value} tasks due today and ${overdueTasksCount.value} overdue tasks. Let's get them done!`;
  } else {
    return `You have ${todayTasksCount.value} tasks due today. You've got this!`;
  }
});
</script>

<style scoped>
.bg-grid-pattern {
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
}
</style>
