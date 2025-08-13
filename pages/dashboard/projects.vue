<!-- pages/dashboard/projects.vue -->
<template>
  <div>
    <!-- Page Header -->
    <div
      class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
        <p class="mt-1 text-gray-600">
          Organize and manage your work with projects.
        </p>
      </div>
      <div class="flex gap-3">
        <FormAppButton
          @click="showCreateModal = true"
          class="flex items-center gap-2"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          New Project
        </FormAppButton>
      </div>
    </div>

    <!-- Projects Grid -->
    <div v-if="pending" class="flex justify-center py-12">
      <UiSpinner class="h-8 w-8 text-blue-600" />
    </div>
    <div v-else-if="error" class="py-12 text-center">
      <Icon
        name="heroicons:exclamation-triangle"
        class="mx-auto mb-4 h-12 w-12 text-red-500"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-900">
        Failed to load projects
      </h3>
      <FormAppButton @click="refresh" variant="secondary">
        Try Again
      </FormAppButton>
    </div>
    <div v-else-if="!projects.length" class="py-12 text-center">
      <Icon
        name="heroicons:folder-plus"
        class="mx-auto mb-6 h-16 w-16 text-gray-400"
      />
      <h3 class="mb-3 text-xl font-medium text-gray-900">No projects yet</h3>
      <p class="mx-auto mb-6 max-w-md text-gray-500">
        Create your first project to organize related tasks.
      </p>
      <FormAppButton @click="showCreateModal = true">
        Create Your First Project
      </FormAppButton>
    </div>
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="project in projects"
        :key="project._id"
        class="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:shadow-lg"
        @click="navigateToProject(project._id)"
      >
        <div class="mb-4 flex items-start justify-between">
          <h3
            class="flex-1 truncate font-semibold text-gray-900 transition-colors group-hover:text-blue-600"
          >
            {{ project.name }}
          </h3>
          <span
            class="ml-3 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
            :class="getStatusClass(project.status)"
          >
            {{ getStatusLabel(project.status) }}
          </span>
        </div>
        <div class="mb-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Progress</span>
            <span class="text-sm text-gray-600">
              {{ project.completedTasks || 0 }} / {{ project.totalTasks || 0 }}
            </span>
          </div>
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="getProgressBarClass(project.completionRate || 0)"
              :style="{ width: `${project.completionRate || 0}%` }"
            ></div>
          </div>
        </div>
        <div class="flex items-center justify-end text-sm text-gray-500">
          <span>Updated {{ formatRelativeDate(project.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Create/Edit Project Modal -->
    <ProjectModal
      v-if="showCreateModal || editingProject"
      :project="editingProject"
      @save="handleSaveProject"
      @cancel="handleCancelModal"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

definePageMeta({ layout: "dashboard", middleware: "02-auth" }); // ✅ fixed name to match file
useSeoMeta({
  title: "Projects - TaskForge",
  description: "Manage your projects and organize your work.",
});

const { projects, pending, error, refresh, createProject, updateProject } =
  useProjects();

const showCreateModal = ref(false);
const editingProject = ref(null);

const navigateToProject = (projectId) =>
  navigateTo(`/dashboard/projects/${projectId}`);

const handleSaveProject = async (projectData) => {
  if (editingProject.value) {
    await updateProject(editingProject.value._id, projectData);
  } else {
    await createProject(projectData);
  }
  handleCancelModal();
};

const handleCancelModal = () => {
  showCreateModal.value = false;
  editingProject.value = null;
};

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

const formatRelativeDate = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
</script>
