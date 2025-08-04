<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
      <button
        @click="refreshActivity"
        class="p-1 text-gray-400 transition-colors hover:text-gray-600"
        :disabled="refreshing"
        title="Refresh activity"
      >
        <Icon
          name="heroicons:arrow-path"
          class="h-4 w-4"
          :class="{ 'animate-spin': refreshing }"
        />
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="flex justify-center py-8">
      <UiSpinner class="h-6 w-6 text-blue-600" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-8 text-center">
      <Icon
        name="heroicons:exclamation-triangle"
        class="mx-auto mb-2 h-8 w-8 text-red-500"
      />
      <p class="text-sm text-red-600">Failed to load activity</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!activities.length" class="py-8 text-center">
      <Icon
        name="heroicons:clock"
        class="mx-auto mb-4 h-12 w-12 text-gray-400"
      />
      <h4 class="mb-2 text-lg font-medium text-gray-900">No recent activity</h4>
      <p class="text-sm text-gray-500">
        Start working on tasks to see your activity here.
      </p>
    </div>

    <!-- Activity list -->
    <div v-else class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="group flex items-start gap-3"
      >
        <!-- Activity icon -->
        <div class="mt-0.5 flex-shrink-0">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full"
            :class="getActivityIconClass(activity.type)"
          >
            <Icon :name="getActivityIcon(activity.type)" class="h-4 w-4" />
          </div>
        </div>

        <!-- Activity content -->
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm text-gray-900">
                <span class="font-medium">{{ activity.action }}</span>
                <span v-if="activity.taskTitle" class="text-gray-600">
                  "{{ truncateText(activity.taskTitle, 30) }}"
                </span>
              </p>

              <div class="mt-1 flex items-center gap-2">
                <time class="text-xs text-gray-500">
                  {{ formatRelativeTime(activity.timestamp) }}
                </time>

                <span
                  v-if="activity.priority"
                  class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
                  :class="getPriorityClass(activity.priority)"
                >
                  {{ activity.priority }}
                </span>
              </div>
            </div>

            <!-- Activity actions -->
            <div
              class="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <button
                v-if="activity.taskId"
                @click="$emit('view-task', activity.taskId)"
                class="p-1 text-gray-400 transition-colors hover:text-blue-600"
                title="View task"
              >
                <Icon name="heroicons:eye" class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Additional context for certain activities -->
          <div v-if="activity.metadata" class="mt-2 text-xs text-gray-500">
            <span
              v-if="
                activity.metadata.previousStatus && activity.metadata.newStatus
              "
            >
              Status changed from {{ activity.metadata.previousStatus }} to
              {{ activity.metadata.newStatus }}
            </span>
            <span v-else-if="activity.metadata.dueDate">
              Due {{ formatDueDate(activity.metadata.dueDate) }}
            </span>
            <span v-else-if="activity.metadata.projectName">
              in {{ activity.metadata.projectName }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- View all activity link -->
    <div
      v-if="activities.length >= 5"
      class="mt-6 border-t border-gray-200 pt-4 text-center"
    >
      <NuxtLink
        to="/dashboard/activity"
        class="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        View All Activity
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const emit = defineEmits(["view-task"]);

// Mock activity data - in a real app, this would come from an API
const activities = ref([
  {
    id: 1,
    type: "task_completed",
    action: "Completed task",
    taskTitle: "Review project proposal and provide feedback",
    taskId: "task_1",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    priority: "high",
    metadata: {
      previousStatus: "in_progress",
      newStatus: "completed",
    },
  },
  {
    id: 2,
    type: "task_created",
    action: "Created new task",
    taskTitle: "Setup meeting with design team",
    taskId: "task_2",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    priority: "medium",
    metadata: {
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  },
  {
    id: 3,
    type: "project_created",
    action: "Created new project",
    taskTitle: "TaskForge Dashboard Redesign",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    metadata: {
      projectName: "TaskForge Dashboard Redesign",
    },
  },
  {
    id: 4,
    type: "task_overdue",
    action: "Task became overdue",
    taskTitle: "Submit quarterly report",
    taskId: "task_6",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    priority: "high",
  },
]);

// Loading states
const pending = ref(false);
const error = ref(null);
const refreshing = ref(false);

// Methods
const getActivityIcon = (type) => {
  const icons = {
    task_completed: "heroicons:check-circle",
    task_created: "heroicons:plus-circle",
    task_updated: "heroicons:pencil-square",
    task_deleted: "heroicons:trash",
    task_overdue: "heroicons:exclamation-triangle",
    project_created: "heroicons:folder-plus",
    comment_added: "heroicons:chat-bubble-left",
  };
  return icons[type] || "heroicons:bell";
};

const getActivityIconClass = (type) => {
  const classes = {
    task_completed: "bg-green-100 text-green-600",
    task_created: "bg-blue-100 text-blue-600",
    task_updated: "bg-yellow-100 text-yellow-600",
    task_deleted: "bg-red-100 text-red-600",
    task_overdue: "bg-red-100 text-red-600",
    project_created: "bg-purple-100 text-purple-600",
    comment_added: "bg-gray-100 text-gray-600",
  };
  return classes[type] || "bg-gray-100 text-gray-600";
};

const getPriorityClass = (priority) => {
  const classes = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };
  return classes[priority] || classes.medium;
};

const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatDueDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 1) return `in ${diffDays} days`;
  return "overdue";
};

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const refreshActivity = async () => {
  refreshing.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  activities.value = [...activities.value].sort(() => Math.random() - 0.5);
  refreshing.value = false;
};

onMounted(async () => {
  pending.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800));
  pending.value = false;
});
</script>
