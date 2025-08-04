<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Productivity Stats</h3>
      <select
        v-model="selectedPeriod"
        class="rounded-md border border-gray-300 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      >
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="quarter">This Quarter</option>
      </select>
    </div>

    <!-- Main Stats Grid -->
    <div class="mb-6 grid grid-cols-2 gap-4">
      <!-- Completion Rate -->
      <div
        class="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center"
      >
        <div class="mb-1 text-2xl font-bold text-green-700">
          {{ completionRate }}%
        </div>
        <div class="text-sm font-medium text-green-600">Completion Rate</div>
        <div class="mt-1 text-xs text-green-500">
          {{ completedTasks }} of {{ totalRelevantTasks }} tasks
        </div>
      </div>

      <!-- Average Daily Tasks -->
      <div
        class="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center"
      >
        <div class="mb-1 text-2xl font-bold text-blue-700">
          {{ averageDailyTasks }}
        </div>
        <div class="text-sm font-medium text-blue-600">Avg Daily Tasks</div>
        <div class="mt-1 text-xs text-blue-500">
          {{ totalRelevantTasks }} tasks total
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div class="space-y-4">
      <!-- Tasks by Status -->
      <div v-if="statusBreakdown.length">
        <h4 class="mb-3 text-sm font-medium text-gray-700">Tasks by Status</h4>
        <div class="space-y-2">
          <div
            v-for="status in statusBreakdown"
            :key="status.name"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-3 w-3 rounded-full"
                :class="status.colorClass"
              ></div>
              <span class="text-sm text-gray-600">{{ status.label }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900">{{
                status.count
              }}</span>
              <span class="text-xs text-gray-500"
                >({{ status.percentage }}%)</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Trend -->
      <div v-if="selectedPeriod === 'week'">
        <h4 class="mb-3 text-sm font-medium text-gray-700">
          This Week's Progress
        </h4>
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(day, index) in weeklyProgress"
            :key="index"
            class="text-center"
          >
            <div class="mb-1 text-xs text-gray-500">{{ day.label }}</div>
            <div
              class="flex h-8 items-center justify-center rounded bg-gray-200 text-xs font-medium"
              :class="
                day.completedTasks > 0
                  ? 'bg-green-200 text-green-700'
                  : 'text-gray-400'
              "
              :title="`${day.completedTasks} tasks completed`"
            >
              {{ day.completedTasks }}
            </div>
          </div>
        </div>
        <div class="mt-2 text-center text-xs text-gray-500">
          Tasks completed each day
        </div>
      </div>

      <!-- Productivity Insights -->
      <div class="rounded-lg bg-gray-50 p-4">
        <h4 class="mb-2 text-sm font-medium text-gray-700">💡 Insights</h4>
        <div class="space-y-1">
          <p
            v-for="insight in productivityInsights"
            :key="insight"
            class="text-xs text-gray-600"
          >
            {{ insight }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
});

const selectedPeriod = ref("week");

const getDateRange = (period) => {
  const now = new Date();
  const startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(now.getDate() - now.getDay());
      break;
    case "month":
      startDate.setDate(1);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate.setMonth(quarter * 3, 1);
      break;
  }
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate: now };
};

const dateRange = computed(() => getDateRange(selectedPeriod.value));

const relevantTasks = computed(() => {
  const { startDate, endDate } = dateRange.value;
  return props.tasks.filter((task) => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= startDate && taskDate <= endDate;
  });
});

const totalRelevantTasks = computed(() => relevantTasks.value.length);

const completedTasks = computed(
  () => relevantTasks.value.filter((task) => task.status === "completed").length
);

const completionRate = computed(() => {
  if (totalRelevantTasks.value === 0) return 0;
  return Math.round((completedTasks.value / totalRelevantTasks.value) * 100);
});

const averageDailyTasks = computed(() => {
  const { startDate, endDate } = dateRange.value;
  const daysDiff =
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
  return parseFloat((totalRelevantTasks.value / daysDiff).toFixed(1));
});

const statusBreakdown = computed(() => {
  const statuses = [
    { name: "completed", label: "Completed", colorClass: "bg-green-500" },
    { name: "in_progress", label: "In Progress", colorClass: "bg-blue-500" },
    { name: "pending", label: "Pending", colorClass: "bg-yellow-500" },
    { name: "cancelled", label: "Cancelled", colorClass: "bg-red-500" },
  ];
  return statuses
    .map((status) => {
      const count = relevantTasks.value.filter(
        (task) => task.status === status.name
      ).length;
      return {
        ...status,
        count,
        percentage:
          totalRelevantTasks.value > 0
            ? Math.round((count / totalRelevantTasks.value) * 100)
            : 0,
      };
    })
    .filter((status) => status.count > 0);
});

const weeklyProgress = computed(() => {
  if (selectedPeriod.value !== "week") return [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startOfWeek = dateRange.value.startDate;
  return days.map((label, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    const dayStr = day.toISOString().split("T")[0];
    const completedTasks = props.tasks.filter((task) => {
      if (task.status !== "completed" || !task.updatedAt) return false;
      return new Date(task.updatedAt).toISOString().split("T")[0] === dayStr;
    }).length;
    return { label, completedTasks };
  });
});

const productivityInsights = computed(() => {
  const insights = [];
  if (completionRate.value >= 80) {
    insights.push("Excellent completion rate! You're very productive.");
  } else if (completionRate.value < 40 && totalRelevantTasks.value > 5) {
    insights.push(
      "Consider breaking down large tasks into smaller, manageable pieces."
    );
  }
  const overdueTasks = relevantTasks.value.filter(
    (task) =>
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "completed"
  ).length;
  if (overdueTasks > 0) {
    insights.push(
      `${overdueTasks} task${
        overdueTasks > 1 ? "s are" : " is"
      } overdue. Prioritize these first.`
    );
  }
  if (insights.length === 0) {
    insights.push(
      "Keep up the good work! Stay consistent with your task management."
    );
  }
  return insights;
});
</script>
