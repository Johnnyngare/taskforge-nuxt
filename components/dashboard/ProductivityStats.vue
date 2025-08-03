<template>
  <div
    class="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors duration-200"
  >
    <h3
      class="text-lg font-semibold text-white mb-6 flex items-center space-x-2"
    >
      <svg
        class="w-5 h-5 text-emerald-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <span>Productivity Stats</span>
    </h3>

    <div class="space-y-6">
      <!-- Tasks Completed This Week -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-slate-300 text-sm font-medium"
            >Tasks Completed this Week</span
          >
          <span class="text-white font-semibold"
            >{{ completedThisWeek }}/{{ totalThisWeek }}</span
          >
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div
            class="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${weeklyCompletionPercentage}%` }"
          ></div>
        </div>
        <div
          class="text-xs text-slate-400 mt-2 flex items-center justify-between"
        >
          <span>{{ weeklyCompletionPercentage }}% completion rate</span>
          <span v-if="totalThisWeek > 0" class="text-emerald-400"
            >{{ averageTasksPerDay }}/day avg</span
          >
        </div>
      </div>

      <!-- Overdue Tasks -->
      <div class="flex items-center justify-between py-2">
        <span class="text-slate-300 text-sm flex items-center space-x-2">
          <svg
            class="w-4 h-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Overdue Tasks</span>
        </span>
        <span
          class="font-semibold text-lg"
          :class="overdueCount > 0 ? 'text-red-400' : 'text-emerald-400'"
        >
          {{ overdueCount }}
        </span>
      </div>

      <!-- Active Projects -->
      <div class="flex items-center justify-between py-2">
        <span class="text-slate-300 text-sm flex items-center space-x-2">
          <svg
            class="w-4 h-4 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span>Projects Active</span>
        </span>
        <span class="text-blue-400 font-semibold text-lg">{{
          activeProjectsCount
        }}</span>
      </div>

      <!-- Weekly Streak -->
      <div class="flex items-center justify-between py-2">
        <span class="text-slate-300 text-sm flex items-center space-x-2">
          <svg
            class="w-4 h-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
          <span>Weekly Productivity</span>
        </span>
        <span
          class="font-semibold text-lg"
          :class="
            weeklyCompletionPercentage >= 70
              ? 'text-emerald-400'
              : weeklyCompletionPercentage >= 40
              ? 'text-amber-400'
              : 'text-slate-400'
          "
        >
          {{ productivityLevel }}
        </span>
      </div>
    </div>

    <!-- Week Progress Chart Placeholder -->
    <div class="mt-6 pt-4 border-t border-slate-700">
      <div
        class="h-20 bg-slate-700/30 rounded-lg flex items-center justify-center relative overflow-hidden"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10"
        ></div>
        <span class="text-slate-400 text-sm relative z-10"
          >[Weekly Trend Chart]</span
        >
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
  completedAt?: string | Date;
}

interface Props {
  tasks?: Task[];
}

const props = withDefaults(defineProps<Props>(), {
  tasks: () => [],
});

// Get start of current week (Monday)
const getWeekBounds = () => {
  const now = new Date();
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, so Sunday is 6 days from Monday

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysFromMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

// Calculate tasks completed this week
const completedThisWeek = computed(() => {
  if (!props.tasks?.length) return 0;

  const { startOfWeek, endOfWeek } = getWeekBounds();

  return props.tasks.filter((task) => {
    if (!task.completed) return false;

    // Try to use completedAt first, then updatedAt, then createdAt as fallback
    let completionDate: Date | null = null;

    if (task.completedAt) {
      completionDate = new Date(task.completedAt);
    } else if (task.completed && task.updatedAt) {
      completionDate = new Date(task.updatedAt);
    } else if (task.completed && task.createdAt) {
      completionDate = new Date(task.createdAt);
    }

    if (!completionDate) return false;

    return completionDate >= startOfWeek && completionDate <= endOfWeek;
  }).length;
});

// Calculate total tasks for this week (created or due this week)
const totalThisWeek = computed(() => {
  if (!props.tasks?.length) return 0;

  const { startOfWeek, endOfWeek } = getWeekBounds();

  const tasksThisWeek = props.tasks.filter((task) => {
    // Count tasks created this week
    if (task.createdAt) {
      const createdDate = new Date(task.createdAt);
      if (createdDate >= startOfWeek && createdDate <= endOfWeek) {
        return true;
      }
    }

    // Count tasks due this week (even if created earlier)
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (dueDate >= startOfWeek && dueDate <= endOfWeek) {
        return true;
      }
    }

    return false;
  });

  // If no tasks match the week criteria, fall back to active tasks for current calculation
  return (
    tasksThisWeek.length || props.tasks.filter((task) => !task.completed).length
  );
});

// Calculate weekly completion percentage
const weeklyCompletionPercentage = computed(() => {
  if (totalThisWeek.value === 0) return 0;
  return Math.round((completedThisWeek.value / totalThisWeek.value) * 100);
});

// Calculate overdue tasks
const overdueCount = computed(() => {
  if (!props.tasks?.length) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return props.tasks.filter((task) => {
    if (task.completed || !task.dueDate) return false;

    const dueDate = new Date(task.dueDate);
    return dueDate < now;
  }).length;
});

// Calculate active projects
const activeProjectsCount = computed(() => {
  if (!props.tasks?.length) return 0;

  const activeProjects = new Set();
  props.tasks.forEach((task) => {
    if (!task.completed && task.project) {
      const projectId =
        typeof task.project === "string" ? task.project : task.project._id;
      if (projectId) {
        activeProjects.add(projectId);
      }
    }
  });

  return activeProjects.size;
});

// Calculate average tasks per day this week
const averageTasksPerDay = computed(() => {
  if (completedThisWeek.value === 0) return 0;
  const daysInWeek = 7;
  return Math.round((completedThisWeek.value / daysInWeek) * 10) / 10; // Round to 1 decimal
});

// Productivity level based on completion percentage
const productivityLevel = computed(() => {
  const percentage = weeklyCompletionPercentage.value;
  if (percentage >= 90) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 50) return "Average";
  if (percentage >= 30) return "Low";
  return "Poor";
});

// Debug logging (remove in production)
onMounted(() => {
  const { startOfWeek, endOfWeek } = getWeekBounds();
  console.log("ProductivityStats Debug:", {
    totalTasks: props.tasks?.length,
    completedThisWeek: completedThisWeek.value,
    totalThisWeek: totalThisWeek.value,
    weeklyCompletionPercentage: weeklyCompletionPercentage.value,
    startOfWeek: startOfWeek.toISOString(),
    endOfWeek: endOfWeek.toISOString(),
    sampleTasks: props.tasks?.slice(0, 3).map((t) => ({
      title: t.title,
      completed: t.completed,
      createdAt: t.createdAt,
      dueDate: t.dueDate,
    })),
  });
});
</script>
