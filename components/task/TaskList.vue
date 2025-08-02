<!-- file: components/task/TaskList.vue -->
<template>
  <div>
    <!-- Loading State: Show a spinner or skeleton loaders -->
    <div v-if="loading" class="p-6 text-center">
      <UiSpinner size="lg" />
      <p class="text-sm text-gray-500 mt-2">Loading tasks...</p>
    </div>

    <!-- Empty State (after filtering) -->
    <div
      v-else-if="filteredTasks.length === 0"
      class="p-6 text-center text-gray-500"
    >
      <p class="font-semibold">No tasks found</p>
      <p class="text-sm mt-1">
        Try adjusting your filters or adding a new task!
      </p>
    </div>

    <!-- Data Loaded: Display the list of filtered tasks -->
    <div v-else class="space-y-4">
      <!--
        THE FIX: Use the correct prefixed name for the component.
        File: components/task/TaskCard.vue -> Name: <TaskTaskCard />
      -->
      <TaskTaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        @statusChange="$emit('task-updated', $event)"
        @delete="$emit('task-deleted', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// 1. Define props to receive data and filters from the parent.
const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  filters: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// 2. Define emits to send events up to the parent (TaskProvider).
defineEmits(["task-updated", "task-deleted"]);

// 3. Create a computed property to apply filters.
const filteredTasks = computed(() => {
  if (!props.tasks) return [];

  return props.tasks.filter((task) => {
    // Status Filter
    if (props.filters.status && props.filters.status !== "all") {
      if (
        (props.filters.status === "completed" && !task.completed) ||
        (props.filters.status === "pending" && task.completed)
      ) {
        return false;
      }
    }

    // Priority Filter
    if (props.filters.priority && props.filters.priority !== "all") {
      if (task.priority !== props.filters.priority) {
        return false;
      }
    }

    // Add more filter logic here for project, dueDate, etc.

    return true; // If the task passes all filters, include it.
  });
});
</script>
