<!-- file: components/task/TaskList.vue -->
<template>
  <div>
    <!-- Loading State: Show a spinner or skeleton loaders -->
    <div v-if="loading" class="p-6 text-center">
      <UiSpinner size="lg" />
      <p class="text-sm text-gray-500 mt-2">Loading tasks...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6 text-center text-red-500">
      <p>Error loading tasks: {{ error.message }}</p>
      <FormAppButton @click="refreshList()" class="mt-2">Retry</FormAppButton>
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
        THE FIX IS HERE:
        The component tag must be <TaskTaskCard /> (PascalCase) to match the
        auto-imported name from components/task/TaskCard.vue.
        Any hyphens (e.g., <TaskTask-Card />) will cause the "Failed to resolve" error.
      -->
      <TaskTaskCard
        v-for="task in filteredTasks"
        :key="task._id"
        :task="task"
        @statusChange="
          (payload) =>
            onTaskUpdated(payload.taskId, {
              status: payload.completed ? 'completed' : 'pending',
            })
        "
        @delete="onTaskDeleted(task._id)"
        @edit="console.log('Edit task:', task._id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import TaskTaskCard from '~/components/task/TaskCard.vue';

// 1. Define props that this component expects to receive from TaskProvider
const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  filters: {
    type: Object,
    default: () => ({
      status: "all",
      priority: "all",
      project: "all",
      dueDate: "all",
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [Object, null],
    default: null,
  },
  // Handlers from the provider that trigger backend actions and data refresh
  onTaskUpdated: {
    type: Function,
    required: true,
  },
  onTaskDeleted: {
    type: Function,
    required: true,
  },
  refreshList: {
    type: Function,
    required: true,
  },
});

// 2. Computed property to apply filters locally to the 'tasks' prop
const filteredTasks = computed(() => {
  if (!props.tasks || props.tasks.length === 0) {
    return [];
  }

  return props.tasks.filter((task) => {
    // --- Apply Status Filter ---
    if (props.filters.status && props.filters.status !== "all") {
      if (task.status !== props.filters.status) {
        return false;
      }
    }

    // --- Apply Priority Filter ---
    if (props.filters.priority && props.filters.priority !== "all") {
      if (task.priority !== props.filters.priority) {
        return false;
      }
    }

    // --- Apply Project Filter ---
    if (props.filters.project && props.filters.project !== "all") {
      if (task.projectId !== props.filters.project) {
        return false;
      }
    }

    return true; // If the task passes all active filters
  });
});
</script>
