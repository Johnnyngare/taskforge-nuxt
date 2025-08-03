<template>
  <div
    class="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center space-x-3 mb-2">
          <div
            class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"
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
          <div>
            <h1 class="text-2xl font-bold">Welcome Back, {{ userName }}!</h1>
            <div class="flex items-center space-x-2 text-emerald-100">
              <div
                class="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"
              ></div>
              <span class="text-sm">Ready to be productive</span>
            </div>
          </div>
        </div>

        <p class="text-emerald-100 text-lg">
          {{ welcomeMessage }}
        </p>
      </div>

      <!-- Stats -->
      <div class="flex space-x-8 ml-6">
        <div class="text-center">
          <div class="text-3xl font-bold mb-1">{{ dueTodayCount }}</div>
          <div class="text-sm text-emerald-100 font-medium">Due Today</div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl font-bold mb-1 transition-colors duration-200"
            :class="overdueCount > 0 ? 'text-red-200' : ''"
          >
            {{ overdueCount }}
          </div>
          <div class="text-sm text-emerald-100 font-medium">Overdue</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Task {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  dueDate?: string | Date;
  project?: string | { name: string; _id: string };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Props {
  tasks?: Task[];
}

const props = withDefaults(defineProps<Props>(), {
  tasks: () => [],
});

// Get user data
const { data: user } = await useFetch<User>("/api/auth/me", {
  default: () => ({ _id: "", name: "User", email: "" }),
});

const userName = computed(() => user.value?.name || "User");

// Helper function to get start and end of today
const getTodayBounds = () => {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );
  return { startOfToday, endOfToday };
};

// Calculate due today count
const dueTodayCount = computed(() => {
  if (!props.tasks?.length) return 0;

  const { startOfToday, endOfToday } = getTodayBounds();

  return props.tasks.filter((task) => {
    // Skip completed tasks
    if (task.completed) return false;

    // Skip tasks without due dates
    if (!task.dueDate) return false;

    const dueDate = new Date(task.dueDate);

    // Check if due date falls within today's bounds
    return dueDate >= startOfToday && dueDate <= endOfToday;
  }).length;
});

// Calculate overdue count
const overdueCount = computed(() => {
  if (!props.tasks?.length) return 0;

  const { startOfToday } = getTodayBounds();

  return props.tasks.filter((task) => {
    // Skip completed tasks
    if (task.completed) return false;

    // Skip tasks without due dates
    if (!task.dueDate) return false;

    const dueDate = new Date(task.dueDate);

    // Check if due date is before today
    return dueDate < startOfToday;
  }).length;
});

// Dynamic welcome message based on stats
const welcomeMessage = computed(() => {
  const totalTasks = props.tasks?.length || 0;
  const completedTasks = props.tasks?.filter((t) => t.completed).length || 0;
  const activeTasks = totalTasks - completedTasks;

  if (totalTasks === 0) {
    return "Ready to add your first task? Let's get started!";
  } else if (activeTasks === 0) {
    return "Great job! You're all caught up. Time to tackle some new challenges.";
  } else if (overdueCount.value > 0) {
    return `You have ${overdueCount.value} overdue task${
      overdueCount.value > 1 ? "s" : ""
    } that need attention.`;
  } else if (dueTodayCount.value > 0) {
    return `You have ${dueTodayCount.value} task${
      dueTodayCount.value > 1 ? "s" : ""
    } due today. Let's get them done!`;
  } else {
    return `You have ${activeTasks} active task${
      activeTasks > 1 ? "s" : ""
    }. Keep up the momentum!`;
  }
});

// Debug logging (remove in production)
onMounted(() => {
  console.log("WelcomeBanner Debug:", {
    totalTasks: props.tasks?.length,
    dueTodayCount: dueTodayCount.value,
    overdueCount: overdueCount.value,
    tasksWithDueDates: props.tasks?.filter((t) => t.dueDate).length,
    sampleDueDates: props.tasks
      ?.slice(0, 3)
      .map((t) => ({
        title: t.title,
        dueDate: t.dueDate,
        completed: t.completed,
      })),
  });
});
</script>
