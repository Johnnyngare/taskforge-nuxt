<template>
  <!-- ... content ... -->
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from "vue";
import { useTasks } from "~/composables/useTasks";
import { TaskPriority, type ITask } from "~/types/task";

definePageMeta({ layout: "dashboard", middleware: "02-auth" }); // FIX: Use '02.auth' route middleware
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