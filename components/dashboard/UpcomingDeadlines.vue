<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
      <button
        v-if="upcomingTasks.length > 3"
        @click="showAll = !showAll"
        class="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        {{ showAll ? "Show Less" : "Show All" }}
      </button>
    </div>

    <!-- No upcoming deadlines -->
    <div v-if="!upcomingTasks.length" class="py-8 text-center">
      <Icon
        name="heroicons:calendar-days"
        class="mx-auto mb-4 h-12 w-12 text-gray-400"
      />
      <h4 class="mb-2 text-lg font-medium text-gray-900">
        No upcoming deadlines
      </h4>
      <p class="text-sm text-gray-500">
        You're all caught up! Great job staying on top of your tasks.
      </p>
    </div>

    <!-- Upcoming tasks list -->
    <div v-else class="space-y-3">
      <div
        v-for="task in displayedTasks"
        :key="task._id"
        class="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
        @click="$emit('task-selected', task)"
      >
        <div class="mt-1 flex-shrink-0">
          <div
            class="h-3 w-3 rounded-full"
            :class="getPriorityColor(task.priority)"
          ></div>
        </div>
        <div class="min-w-0 flex-1">
          <h4
            class="truncate font-medium text-gray-900 transition-colors group-hover:text-blue-600"
          >
            {{ task.title }}
          </h4>
          <div class="mt-1 flex items-center gap-1">
            <Icon
              name="heroicons:clock"
              class="h-4 w-4"
              :class="getUrgencyColor(task.dueDate)"
            />
            <span
              class="text-sm font-medium"
              :class="getUrgencyColor(task.dueDate)"
            >
              {{ formatDueDate(task.dueDate) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary statistics -->
    <div
      v-if="upcomingTasks.length > 0"
      class="mt-6 border-t border-gray-200 pt-4"
    >
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-lg font-semibold text-red-600">
            {{ overdueTasks }}
          </div>
          <div class="text-xs text-gray-500">Overdue</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-orange-600">
            {{ dueTodayTasks }}
          </div>
          <div class="text-xs text-gray-500">Due Today</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-blue-600">
            {{ dueThisWeekTasks }}
          </div>
          <div class="text-xs text-gray-500">This Week</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  tasks: { type: Array, default: () => [] },
});
const emit = defineEmits(["task-selected"]);
const showAll = ref(false);

const upcomingTasks = computed(() => {
  const now = new Date();
  return props.tasks
    .filter((task) => task.dueDate && task.status !== "completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
});

const displayedTasks = computed(() =>
  showAll.value ? upcomingTasks.value : upcomingTasks.value.slice(0, 3)
);

const overdueTasks = computed(
  () =>
    upcomingTasks.value.filter(
      (task) => new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0)
    ).length
);

const dueTodayTasks = computed(
  () =>
    upcomingTasks.value.filter(
      (task) =>
        new Date(task.dueDate).toDateString() === new Date().toDateString()
    ).length
);

const dueThisWeekTasks = computed(() => {
  const now = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  return upcomingTasks.value.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return dueDate >= now && dueDate <= endOfWeek;
  }).length;
});

const getPriorityColor = (priority) =>
  ({
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }[priority] || "bg-gray-400");

const getUrgencyColor = (dueDate) => {
  const taskDueDate = new Date(dueDate);
  const today = new Date();
  if (taskDueDate < today.setHours(0, 0, 0, 0)) return "text-red-600";
  if (taskDueDate.toDateString() === new Date().toDateString())
    return "text-orange-600";
  return "text-gray-500";
};

const formatDueDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  return `In ${diffDays} days`;
};
</script>
