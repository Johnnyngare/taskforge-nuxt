<!-- components/task/TaskCard.vue -->
<template>
  <!-- NEW: Added ref="cardRef" for the click-outside functionality -->
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
                task.status === 'completed'
                  ? 'heroicons:arrow-uturn-left'
                  : 'heroicons:check'
              "
              class="h-4 w-4"
            />
            {{ task.status === "completed" ? "Mark Pending" : "Mark Complete" }}
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
      <!-- Assuming TaskPriorityBadge exists and works -->
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

<!-- FIX: Switched to TypeScript with lang="ts" -->
<script setup lang="ts">
import { ref, computed } from "vue";
// NEW: Import from @vueuse/core for robust click-outside detection
import { onClickOutside } from "@vueuse/core";
// FIX: Import ITask and other types for strong typing
import type { ITask, TaskStatus } from "~/types/task";

// FIX: Use strongly typed props
const props = defineProps<{
  task: ITask;
}>();

// FIX: Use strongly typed emits
const emit = defineEmits<{
  (e: "edit", id: string): void;
  (e: "delete", id: string): void;
  (e: "status-changed", id: string, updates: { status: TaskStatus }): void;
}>();

const showDropdown = ref(false);
// NEW: Create a template ref for the component's root element
const cardRef = ref<HTMLElement | null>(null);

// NEW: Use @vueuse/core's onClickOutside for a reliable, SSR-safe implementation
onClickOutside(cardRef, () => {
  showDropdown.value = false;
});

// FIX: This computed property is now fully type-safe.
const statusInfo = computed(() => {
  const statuses: Record<
    TaskStatus,
    { label: string; classes: string; dot: string }
  > = {
    pending: {
      label: "Pending",
      classes: "bg-amber-500/10 text-amber-400",
      dot: "bg-amber-500",
    },
    in_progress: {
      label: "In Progress",
      classes: "bg-blue-500/10 text-blue-400",
      dot: "bg-blue-500",
    },
    completed: {
      label: "Completed",
      classes: "bg-emerald-500/10 text-emerald-400",
      dot: "bg-emerald-500",
    },
    cancelled: {
      label: "Cancelled",
      classes: "bg-rose-500/10 text-rose-400",
      dot: "bg-rose-500",
    },
  };
  // FIX: Safely access the status, providing a fallback if the status is invalid
  return statuses[props.task.status] || statuses.pending;
});

const statusClasses = computed(() => statusInfo.value.classes);
const statusDotClasses = computed(() => statusInfo.value.dot);
const statusLabel = computed(() => statusInfo.value.label);

const dueDateClasses = computed(() => {
  if (!props.task.dueDate || props.task.status === "completed") {
    return "text-slate-400";
  }
  const dueDate = new Date(props.task.dueDate);
  // FIX: Add a check for invalid dates to prevent runtime errors
  if (isNaN(dueDate.getTime())) return "text-slate-400";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) return "text-rose-400";
  if (dueDate.toDateString() === today.toDateString()) return "text-amber-400";
  return "text-slate-400";
});

const toggleDropdown = () => (showDropdown.value = !showDropdown.value);

const handleEdit = () => {
  emit("edit", props.task._id);
  showDropdown.value = false;
};

const handleDelete = () => {
  // The confirm dialog is better handled in the parent page.
  emit("delete", props.task._id);
  showDropdown.value = false;
};

const handleStatusToggle = () => {
  const newStatus: TaskStatus =
    props.task.status === "completed" ? "pending" : "completed";
  emit("status-changed", props.task._id, { status: newStatus });
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
  // FIX: Use getTime() for reliable date arithmetic
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
