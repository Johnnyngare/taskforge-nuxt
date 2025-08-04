<template>
  <div class="space-y-4">
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
      <p class="mb-4 text-sm text-red-600">Failed to load projects</p>
      <FormAppButton @click="refresh" variant="secondary" size="sm">
        Try Again
      </FormAppButton>
    </div>

    <!-- Empty state -->
    <div v-else-if="!projects.length" class="py-8 text-center">
      <Icon
        name="heroicons:folder-plus"
        class="mx-auto mb-4 h-12 w-12 text-gray-400"
      />
      <h4 class="mb-2 text-lg font-medium text-gray-900">No projects yet</h4>
      <p class="mb-4 text-sm text-gray-500">
        Organize your tasks by creating projects.
      </p>
      <FormAppButton @click="$emit('create-project')">
        Create Project
      </FormAppButton>
    </div>

    <!-- Projects list -->
    <div v-else class="space-y-3">
      <div
        v-for="project in displayedProjects"
        :key="project._id"
        class="group cursor-pointer rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
        @click="$emit('project-selected', project)"
      >
        <!-- Project header -->
        <div class="mb-3 flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <h4
              class="truncate font-medium text-gray-900 transition-colors group-hover:text-blue-600"
            >
              {{ project.name }}
            </h4>
          </div>
          <span
            class="ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
            :class="getStatusClass(project.status)"
          >
            {{ getStatusLabel(project.status) }}
          </span>
        </div>

        <!-- Project metrics -->
        <div class="mb-3 grid grid-cols-2 gap-4">
          <!-- Task completion -->
          <div>
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500">Tasks</span>
              <span class="text-xs text-gray-700">
                {{ project.completedTasks }} / {{ project.totalTasks }}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="getProgressBarClass(project.completionRate)"
                :style="{ width: `${project.completionRate}%` }"
              ></div>
            </div>
          </div>

          <!-- Team members -->
          <div v-if="project.teamMembers?.length">
            <span class="mb-1 block text-xs font-medium text-gray-500"
              >Team</span
            >
            <div class="flex -space-x-1">
              <div
                v-for="member in project.teamMembers.slice(0, 3)"
                :key="member.id"
                class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-700 text-xs font-medium text-white"
                :title="member.name"
              >
                {{ getInitials(member.name) }}
              </div>
              <div
                v-if="project.teamMembers.length > 3"
                class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-xs font-medium text-gray-600"
              >
                +{{ project.teamMembers.length - 3 }}
              </div>
            </div>
          </div>
        </div>

        <!-- Project footer -->
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div class="flex items-center gap-4">
            <div v-if="project.dueDate" class="flex items-center gap-1">
              <Icon name="heroicons:calendar-days" class="h-3 w-3" />
              <span>Due {{ formatDueDate(project.dueDate) }}</span>
            </div>
          </div>
          <span>Updated {{ formatRelativeDate(project.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Show more button -->
    <div v-if="projects.length > 3 && !showAll" class="pt-2 text-center">
      <button
        @click="showAll = true"
        class="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        Show {{ projects.length - 3 }} more
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const emit = defineEmits(["project-selected", "create-project"]);
const { projects, pending, error, refresh } = useProjects();
const showAll = ref(false);

const displayedProjects = computed(() => {
  const projectList = projects.value || [];
  return showAll.value ? projectList : projectList.slice(0, 3);
});

const getStatusClass = (status) =>
  ({
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    on_hold: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  }[status] || "bg-gray-100 text-gray-700");

const getStatusLabel = (status) =>
  ({
    active: "Active",
    completed: "Completed",
    on_hold: "On Hold",
    cancelled: "Cancelled",
  }[status] || "N/A");

const getProgressBarClass = (rate) => {
  if (rate === 100) return "bg-green-500";
  if (rate >= 75) return "bg-blue-500";
  if (rate >= 50) return "bg-yellow-500";
  return "bg-orange-500";
};

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "";

const formatDueDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
</script>
