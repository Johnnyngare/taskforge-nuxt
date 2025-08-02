<!-- components/TaskCard.vue -->
<template>
  <div
    class="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 cursor-pointer"
    @click="$emit('click', task)"
  >
    <!-- Task Header -->
    <div class="flex items-start justify-between mb-4">
      <!-- Task Checkbox and Title -->
      <div class="flex items-start space-x-3 flex-1 min-w-0">
        <!-- Custom Checkbox -->
        <div class="flex-shrink-0 mt-1">
          <input
            :id="`task-${task.id}`"
            v-model="isCompleted"
            type="checkbox"
            class="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            @change="handleStatusChange"
            @click.stop
          />
        </div>

        <!-- Task Details -->
        <div class="flex-1 min-w-0">
          <h3
            :class="[
              'text-lg font-semibold transition-all duration-200',
              isCompleted
                ? 'text-gray-500 dark:text-gray-400 line-through'
                : 'text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
            ]"
          >
            {{ task.title }}
          </h3>

          <!-- Task Description -->
          <p
            v-if="task.description"
            :class="[
              'mt-1 text-sm line-clamp-2 transition-colors duration-200',
              isCompleted
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-600 dark:text-gray-300',
            ]"
          >
            {{ task.description }}
          </p>
        </div>
      </div>

      <!-- Priority Badge -->
      <TaskPriorityBadge :priority="task.priority" class="flex-shrink-0 ml-3" />
    </div>

    <!-- Task Metadata -->
    <div class="flex items-center justify-between text-sm">
      <!-- Left side: Project and Tags -->
      <div class="flex items-center space-x-3">
        <!-- Project -->
        <div
          v-if="task.project"
          class="flex items-center space-x-1 text-gray-500 dark:text-gray-400"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
          <span class="truncate">{{ task.project }}</span>
        </div>

        <!-- Tags -->
        <div
          v-if="task.tags && task.tags.length > 0"
          class="flex items-center space-x-1"
        >
          <div
            v-for="tag in task.tags.slice(0, 2)"
            :key="tag"
            class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium"
          >
            {{ tag }}
          </div>
          <span
            v-if="task.tags.length > 2"
            class="text-gray-400 dark:text-gray-500 text-xs"
          >
            +{{ task.tags.length - 2 }}
          </span>
        </div>
      </div>

      <!-- Right side: Due Date and Actions -->
      <div class="flex items-center space-x-3">
        <!-- Due Date -->
        <div
          v-if="task.dueDate"
          :class="[
            'flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-md',
            dueDateStatus.class,
          ]"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>{{ dueDateStatus.text }}</span>
        </div>

        <!-- Quick Actions (visible on hover) -->
        <div
          class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <!-- Edit Button -->
          <button
            @click.stop="$emit('edit', task)"
            class="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors duration-200"
            title="Edit task"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              ></path>
            </svg>
          </button>

          <!-- Delete Button -->
          <button
            @click.stop="$emit('delete', task)"
            class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
            title="Delete task"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Progress Bar (if task has subtasks) -->
    <div v-if="task.subtasks && task.subtasks.length > 0" class="mt-4">
      <div
        class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2"
      >
        <span>Progress</span>
        <span>{{ completedSubtasks }}/{{ task.subtasks.length }} subtasks</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-emerald-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component props
const props = defineProps({
  task: {
    type: Object,
    required: true,
    validator: (task) => {
      return (
        task && typeof task.id !== "undefined" && typeof task.title === "string"
      );
    },
  },
});

// Component emits
const emit = defineEmits(["click", "edit", "delete", "statusChange"]);

// Reactive data
const isCompleted = ref(props.task.completed || false);

// Computed properties
const completedSubtasks = computed(() => {
  if (!props.task.subtasks) return 0;
  return props.task.subtasks.filter((subtask) => subtask.completed).length;
});

const progressPercentage = computed(() => {
  if (!props.task.subtasks || props.task.subtasks.length === 0) return 0;
  return Math.round(
    (completedSubtasks.value / props.task.subtasks.length) * 100
  );
});

const dueDateStatus = computed(() => {
  if (!props.task.dueDate) return null;

  const today = new Date();
  const dueDate = new Date(props.task.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)} days overdue`,
      class: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
  } else if (diffDays === 0) {
    return {
      text: "Due today",
      class:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    };
  } else if (diffDays === 1) {
    return {
      text: "Due tomorrow",
      class:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    };
  } else if (diffDays <= 7) {
    return {
      text: `Due in ${diffDays} days`,
      class: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    };
  } else {
    return {
      text: dueDate.toLocaleDateString(),
      class: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    };
  }
});

// Methods
const handleStatusChange = () => {
  emit("statusChange", {
    taskId: props.task.id,
    completed: isCompleted.value,
  });
};

// Watch for external changes to task completion status
watch(
  () => props.task.completed,
  (newValue) => {
    isCompleted.value = newValue;
  }
);
</script>

<style scoped>
/* Custom line-clamp utility for description text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
