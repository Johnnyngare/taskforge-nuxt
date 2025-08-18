<!-- components/TaskCard.vue -->
<template>
  <div
    ref="cardRef"
    class="group rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-md transition-all duration-200 hover:border-emerald-500"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <h3
          class="truncate font-medium text-slate-200 transition-colors group-hover:text-emerald-400"
        >
          {{ task.title }}
        </h3>
        <p v-if="task.description" class="mt-1 truncate text-sm text-slate-400">
          {{ task.description }}
        </p>
      </div>

      <div class="relative ml-3">
        <button
          @click.stop="toggleDropdown"
          class="rounded-md p-1 text-slate-400 opacity-0 transition-all duration-200 hover:bg-slate-700 hover:text-white group-hover:opacity-100"
          title="Task actions"
        >
          <Icon name="heroicons:ellipsis-vertical" class="h-5 w-5" />
        </button>

        <div
          v-if="showDropdown"
          class="absolute right-0 top-8 z-10 w-48 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg animate-in fade-in duration-200"
        >
          <button
            @click="handleStatusToggle"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700"
          >
            <Icon
              :name="
                task.status === TaskStatus.Completed
                  ? 'heroicons:arrow-uturn-left'
                  : 'heroicons:check'
              "
              class="h-4 w-4"
            />
            {{
              task.status === TaskStatus.Completed
                ? "Mark Pending"
                : "Mark Complete"
            }}
          </button>
          <button
            @click="handleEdit"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700"
          >
            <Icon name="heroicons:pencil" class="h-4 w-4" />
            Edit Task
          </button>
          <hr class="my-1 border-slate-700" />
          <button
            @click="handleDelete"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-600"
          >
            <Icon name="heroicons:trash" class="h-4 w-4" />
            Delete Task
          </button>
        </div>
      </div>
    </div>

    <div class="mt-3 mb-4 flex flex-wrap items-center gap-2">
      <TaskPriorityBadge :priority="task.priority" />
      <span
        class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
        :class="statusClasses"
      >
        <span
          class="mr-1.5 h-1.5 w-1.5 rounded-full"
          :class="statusDotClasses"
        ></span>
        {{ statusLabel }}
      </span>
      <!-- NEW: Display Project Name -->
      <span
        v-if="task.project"
        class="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400"
      >
        <Icon name="heroicons:folder" class="mr-1.5 h-3 w-3" />
        {{ task.project.name }}
      </span>
      <!-- NEW: Display Task Cost -->
      <span
        v-if="typeof task.cost === 'number'"
        class="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400"
      >
        <Icon name="heroicons:currency-dollar" class="mr-1.5 h-3 w-3" />
        {{ task.cost.toLocaleString() }}
      </span>
    </div>

    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center gap-4 text-slate-400">
        <div
          v-if="task.dueDate"
          class="flex items-center gap-1"
          :class="dueDateClasses"
        >
          <Icon name="heroicons:calendar-days" class="h-4 w-4" />
          <span>{{ formatDueDate(task.dueDate) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="heroicons:clock" class="h-4 w-4" />
          <span>{{ formatRelativeDate(task.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onClickOutside } from "@vueuse/core";
import { TaskStatus, type ITask } from "~/types/task";

const props = defineProps<{
  task: ITask;
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
  (e: "delete", id: string): void;
  (e: "status-changed", id: string, updates: { status: TaskStatus }): void;
}>();

const showDropdown = ref(false);
const cardRef = ref<HTMLElement | null>(null);

onClickOutside(cardRef, () => {
  showDropdown.value = false;
});

const statusInfo = computed(() => {
  const statuses: Record<
    TaskStatus,
    { label: string; classes: string; dot: string }
  > = {
    [TaskStatus.Pending]: {
      label: "Pending",
      classes: "bg-amber-500/10 text-amber-400",
      dot: "bg-amber-500",
    },
    [TaskStatus.InProgress]: {
      label: "In Progress",
      classes: "bg-blue-500/10 text-blue-400",
      dot: "bg-blue-500",
    },
    [TaskStatus.Completed]: {
      label: "Completed",
      classes: "bg-emerald-500/10 text-emerald-400",
      dot: "bg-emerald-500",
    },
    [TaskStatus.Cancelled]: {
      label: "Cancelled",
      classes: "bg-rose-500/10 text-rose-400",
      dot: "bg-rose-500",
    },
  };
  return statuses[props.task.status] || statuses[TaskStatus.Pending];
});

const statusClasses = computed(() => statusInfo.value.classes);
const statusDotClasses = computed(() => statusInfo.value.dot);
const statusLabel = computed(() => statusInfo.value.label);

const dueDateClasses = computed(() => {
  if (!props.task.dueDate || props.task.status === TaskStatus.Completed) {
    return "text-slate-400";
  }
  const dueDate = new Date(props.task.dueDate);
  if (isNaN(dueDate.getTime())) return "text-slate-400";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) return "text-rose-400";
  if (dueDate.toDateString() === today.toDateString()) return "text-amber-400";
  return "text-slate-400";
});

const toggleDropdown = () => (showDropdown.value = !showDropdown.value);

const handleEdit = () => {
  console.log("TaskCard: Emitting 'edit' for task ID:", props.task.id);
  emit("edit", props.task.id);
  showDropdown.value = false;
};

const handleDelete = () => {
  console.log("TaskCard: Emitting 'delete' for task ID:", props.task.id);
  emit("delete", props.task.id);
  showDropdown.value = false;
};

const handleStatusToggle = () => {
  const newStatus: TaskStatus =
    props.task.status === TaskStatus.Completed
      ? TaskStatus.Pending
      : TaskStatus.Completed;
  console.log("TaskCard: Emitting 'status-changed' for task ID:", props.task.id, "new status:", newStatus);
  emit("status-changed", props.task.id, { status: newStatus });
  showDropdown.value = false;
};

const formatDueDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const diff = new Date().getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-in {
  animation: fade-in 0.2s ease-out;
}
</style>