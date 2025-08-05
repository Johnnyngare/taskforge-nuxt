<template>
  <div class="space-y-3">
    <!-- Check if tasks array is empty to show a "no tasks" message -->
    <div
      v-if="!tasks || tasks.length === 0"
      class="py-8 text-center text-slate-400"
    >
      <Icon
        name="heroicons:clipboard-document-list"
        class="mx-auto h-12 w-12 mb-4 opacity-50"
      />
      <p class="text-lg mb-2">No tasks found</p>
      <p class="text-sm">Try adjusting your filters or create a new task!</p>
    </div>

    <!-- Render tasks if available -->
    <div
      v-else
      v-for="task in tasks"
      :key="task._id"
      class="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800 p-4 transition-colors hover:bg-slate-700"
    >
      <!-- Status Checkbox -->
      <button
        @click="toggleTaskStatus(task)"
        class="flex-shrink-0"
        :class="[
          'h-5 w-5 rounded border-2 transition-colors',
          task.status === 'completed'
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-400 hover:border-emerald-400',
        ]"
      >
        <Icon
          v-if="task.status === 'completed'"
          name="heroicons:check"
          class="h-3 w-3 text-white mx-auto"
        />
      </button>

      <!-- Task Content -->
      <div class="flex-1 min-w-0">
        <h4
          class="font-medium transition-colors"
          :class="[
            task.status === 'completed'
              ? 'text-slate-400 line-through'
              : 'text-slate-200',
          ]"
        >
          {{ task.title }}
        </h4>
        <p v-if="task.description" class="mt-1 truncate text-sm text-slate-400">
          {{ task.description }}
        </p>
        <div class="mt-2 flex items-center gap-3">
          <!-- Priority Badge -->
          <span
            v-if="task.priority"
            class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
            :class="getPriorityClasses(task.priority)"
          >
            {{ task.priority }}
          </span>
          <!-- Due Date -->
          <span v-if="task.dueDate" class="text-xs text-slate-400">
            Due {{ formatDueDate(task.dueDate) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="
            $emit('task-updated', task._id, {
              status: task.status === 'completed' ? 'pending' : 'completed',
            })
          "
          class="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-emerald-400"
          :title="
            task.status === 'completed'
              ? 'Mark as pending'
              : 'Mark as completed'
          "
        >
          <Icon
            :name="
              task.status === 'completed'
                ? 'heroicons:arrow-uturn-left'
                : 'heroicons:check'
            "
            class="h-4 w-4"
          />
        </button>
        <button
          @click="$emit('task-deleted', task._id)"
          class="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-rose-400"
          title="Delete task"
        >
          <Icon name="heroicons:trash" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"; // Keep computed if needed, remove defineProps/Emits

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["task-updated", "task-deleted", "edit-task"]); // Added edit-task if needed by TaskCard

const toggleTaskStatus = (task) => {
  const newStatus = task.status === "completed" ? "pending" : "completed";
  emit("task-updated", task._id, { status: newStatus });
};

const getPriorityClasses = (priority) => {
  const classes = {
    low: "bg-blue-500/20 text-blue-300", // Using primary/secondary accent colors
    medium: "bg-amber-500/20 text-amber-300",
    high: "bg-rose-500/20 text-rose-300",
    urgent: "bg-rose-500/20 text-rose-300", // Often same as High or more intense red
  };
  return classes[priority?.toLowerCase()] || classes.medium;
};

const formatDueDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime(); // Use getTime() for Date objects
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 1) return `in ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
</script>
