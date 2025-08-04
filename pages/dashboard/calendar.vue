<template>
  <div>
    <!-- Page Header -->
    <div
      class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Calendar</h1>
        <p class="mt-1 text-gray-600">View and manage your tasks by date.</p>
      </div>
      <div class="flex gap-3">
        <FormAppButton @click="goToToday" variant="secondary">
          Today
        </FormAppButton>
        <FormAppButton
          @click="showCreateModal = true"
          class="flex items-center gap-2"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          Add Task
        </FormAppButton>
      </div>
    </div>

    <!-- Calendar Navigation -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateCalendar(-1)"
          class="p-2 text-gray-400 transition-colors hover:text-gray-600"
        >
          <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        </button>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ currentMonthYear }}
        </h2>
        <button
          @click="navigateCalendar(1)"
          class="p-2 text-gray-400 transition-colors hover:text-gray-600"
        >
          <Icon name="heroicons:chevron-right" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div class="grid grid-cols-7 border-b border-gray-200">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="bg-gray-50 p-4 text-center text-sm font-medium text-gray-500"
        >
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="day in calendarDays"
          :key="day.date.toDateString()"
          class="relative min-h-[120px] border-b border-r border-gray-200 p-2"
          :class="{
            'bg-gray-50': !day.isCurrentMonth,
            'bg-blue-50': day.isToday,
          }"
        >
          <span
            class="text-sm font-medium"
            :class="{
              'text-gray-400': !day.isCurrentMonth,
              'text-blue-600': day.isToday,
            }"
          >
            {{ day.date.getDate() }}
          </span>
          <div class="mt-1 space-y-1">
            <div
              v-for="task in getTasksForDate(day.date)"
              :key="task._id"
              class="cursor-pointer rounded p-1 text-xs transition-all hover:shadow-sm"
              :class="getTaskStyle(task)"
              @click="openTaskDetail(task)"
              :title="task.title"
            >
              <span class="truncate font-medium">{{ task.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <TaskEditModal
      v-if="selectedTask"
      :task="selectedTask"
      @save="handleTaskUpdate"
      @cancel="selectedTask = null"
    />
    <DashboardQuickAddTask
      v-if="showCreateModal"
      @task-created="handleTaskCreated"
      @close="showCreateModal = false"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: "dashboard", middleware: "auth" });
useSeoMeta({
  title: "Calendar - TaskForge",
  description: "View and manage your tasks in calendar format.",
});

const { tasks, updateTask, createTask } = useTasks();

const currentDate = ref(new Date());
const showCreateModal = ref(false);
const selectedTask = ref(null);
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentMonthYear = computed(() =>
  currentDate.value.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
);

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push({
      date: new Date(d),
      isCurrentMonth: d.getMonth() === month,
      isToday: d.toDateString() === new Date().toDateString(),
    });
  }
  return days;
});

const navigateCalendar = (direction) => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + direction);
  currentDate.value = newDate;
};

const goToToday = () => (currentDate.value = new Date());

const getTasksForDate = (date) => {
  const dateStr = date.toDateString();
  return tasks.value.filter(
    (task) => task.dueDate && new Date(task.dueDate).toDateString() === dateStr
  );
};

const getTaskStyle = (task) => {
  const priorityStyles = {
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return priorityStyles[task.priority] || "bg-gray-100 text-gray-800";
};

const openTaskDetail = (task) => (selectedTask.value = task);

const handleTaskCreated = async () => {
  showCreateModal.value = false;
  // Task list will auto-update via useTasks composable
};

const handleTaskUpdate = async (updates) => {
  if (!selectedTask.value) return;
  await updateTask(selectedTask.value._id, updates);
  selectedTask.value = null;
};
</script>
