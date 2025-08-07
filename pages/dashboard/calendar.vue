<!-- pages/dashboard/calendar.vue -->
<template>
  <div>
    <div
      class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-white">Calendar</h1>
        <p class="mt-1 text-slate-400">View and manage your tasks by date.</p>
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

    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateCalendar(-1)"
          class="p-2 text-slate-400 transition-colors hover:text-white"
        >
          <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        </button>
        <h2 class="text-xl font-semibold text-white">
          {{ currentMonthYear }}
        </h2>
        <button
          @click="navigateCalendar(1)"
          class="p-2 text-slate-400 transition-colors hover:text-white"
        >
          <Icon name="heroicons:chevron-right" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-sm"
    >
      <div class="grid grid-cols-7 border-b border-slate-700">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="bg-slate-900 p-4 text-center text-sm font-medium text-slate-400"
        >
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="day in calendarDays"
          :key="day.date.toDateString()"
          class="relative min-h-[120px] border-b border-r border-slate-700 p-2"
          :class="{
            'bg-slate-800/50': !day.isCurrentMonth,
            'bg-emerald-900/30': day.isToday,
          }"
        >
          <span
            class="text-sm font-medium"
            :class="{
              'text-slate-500': !day.isCurrentMonth,
              'text-emerald-400': day.isToday,
            }"
          >
            {{ day.date.getDate() }}
          </span>
          <div class="mt-1 space-y-1">
            <div
              v-for="task in getTasksForDate(day.date)"
              :key="task.id"
              class="cursor-pointer rounded p-1 text-xs transition-all hover:shadow-lg"
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

    <TaskEditModal
      v-if="selectedTask"
      :task="selectedTask"
      @save="handleSaveEdit"
      @cancel="selectedTask = null"
    />
    <DashboardQuickAddTask
      v-if="showCreateModal"
      @task-created="handleTaskCreated"
      @close="showCreateModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from "vue";
import { useTasks } from "~/composables/useTasks";
import { TaskPriority, type ITask } from "~/types/task";

definePageMeta({ layout: "dashboard", middleware: "auth" });
useSeoMeta({
  title: "Calendar - TaskForge",
  description: "View and manage your tasks in calendar format.",
});

const { tasks, updateTask } = useTasks();
const toast = useToast();

const currentDate = ref(new Date());
const showCreateModal = ref(false);
const selectedTask: Ref<ITask | null> = ref(null);
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

const navigateCalendar = (direction: number) => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + direction);
  currentDate.value = newDate;
};

const goToToday = () => (currentDate.value = new Date());

const getTasksForDate = (date: Date) => {
  if (!tasks.value) return [];
  const normalizedInputDate = new Date(date);
  normalizedInputDate.setHours(0, 0, 0, 0);

  return tasks.value.filter((task) => {
    if (!task.dueDate) return false;
    const taskDueDate = new Date(task.dueDate);
    if (isNaN(taskDueDate.getTime())) return false;
    taskDueDate.setHours(0, 0, 0, 0);
    return taskDueDate.getTime() === normalizedInputDate.getTime();
  });
};

const getTaskStyle = (task: ITask) => {
  const priorityStyles: Record<TaskPriority, string> = {
    [TaskPriority.Low]: "bg-sky-500/20 text-sky-300 hover:bg-sky-500/40",
    [TaskPriority.Medium]:
      "bg-amber-500/20 text-amber-300 hover:bg-amber-500/40",
    [TaskPriority.High]:
      "bg-orange-500/20 text-orange-300 hover:bg-orange-500/40",
    [TaskPriority.Urgent]: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/40",
  };
  return priorityStyles[task.priority] || priorityStyles.Medium;
};

const openTaskDetail = (task: ITask) => (selectedTask.value = task);

const handleTaskCreated = () => {
  showCreateModal.value = false;
  toast.add({ title: "Task created!", color: "green" });
};

const handleSaveEdit = async (taskId: string, updates: Partial<ITask>) => {
  if (!selectedTask.value) return;
  await updateTask(taskId, updates);
  selectedTask.value = null;
  toast.add({ title: "Task saved!", color: "green" });
};
</script>
