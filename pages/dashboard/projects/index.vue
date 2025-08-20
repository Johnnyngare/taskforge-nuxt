<!-- pages/dashboard/projects/index.vue -->
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
      <p class="ml-2 text-blue-600">Loading projects...</p>
    </div>
    <div v-else-if="error" class="py-12 text-center">
      <Icon
        name="heroicons:exclamation-triangle"
        class="mx-auto mb-4 h-12 w-12 text-red-500"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-900">
        Failed to load projects
      </h3>
      <p class="text-red-600">{{ error.message }}</p>
      <FormAppButton @click="refresh" variant="secondary">
        Try Again
      </FormAppButton>
    </div>
    <div v-else-if="!projects || projects.length === 0" class="py-12 text-center">
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
        :key="project.id"
        class="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:shadow-lg"
        @click="navigateToProject(project.id)"
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

<script setup lang="ts">
import { ref } from "vue";
import { useNotifier } from "~/composables/useNotifier";
import { useProjects } from "~/composables/useProjects";
import { ProjectStatus, ProjectPriority, type IProject } from "~/types/project";
import { navigateTo } from '#app';

definePageMeta({ layout: "dashboard", middleware: "02-auth" });
useSeoMeta({
  title: "Projects - TaskForge",
  description: "Manage your projects and organize your work.",
});

const notifier = useNotifier();

const { projects, pending, error, refresh, createProject, updateProject } =
  useProjects();

const showCreateModal = ref(false);
const editingProject = ref<IProject | null>(null);

const navigateToProject = (projectId: string) => {
  console.log(`[projects.vue] DEBUG: navigateToProject called with projectId: "${projectId}"`);
  const targetPath = `/dashboard/projects/${projectId}`;
  console.log(`[projects.vue] DEBUG: Constructed target path: "${targetPath}"`);
  navigateTo(targetPath);
};

const handleSaveProject = async (projectData: Partial<IProject>) => {
  console.log('projects/index.vue: handleSaveProject received payload:', projectData);
  let response;
  try {
    if (editingProject.value) {
      if (!editingProject.value.id) {
        notifier.error("Error: Cannot update project without an ID.");
        return;
      }
      notifier.info("Updating project...");
      response = await updateProject(editingProject.value.id, projectData);
    } else {
      notifier.info("Creating new project...");
      response = await createProject(projectData);
    }

    if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
      notifier.success(response.message || "Project saved successfully!");
      handleCancelModal();
      if (response.project?.id) {
        console.log(`[projects.vue] DEBUG: Navigating to new project details: ${response.project.id}`);
        navigateToProject(response.project.id);
      }
    } else {
      const errorMessage = response?.message || "An unknown error occurred.";
      notifier.error(`Failed to save project: ${errorMessage}`);
      console.error('API Error Response:', response);
    }
  } catch (err: any) {
    console.error("Failed to save project in handleSaveProject:", err);
    const errorMessage = err.message || "An unexpected error occurred during project saving.";
    notifier.error(`Operation failed: ${errorMessage}`);
  }
};

const handleCancelModal = () => {
  showCreateModal.value = false;
  editingProject.value = null;
};

const getStatusClass = (status: ProjectStatus) =>
  ({
    [ProjectStatus.Active]: "bg-green-100 text-green-700",
    [ProjectStatus.Completed]: "bg-blue-100 text-blue-700",
    [ProjectStatus.OnHold]: "bg-yellow-100 text-yellow-700",
    [ProjectStatus.Cancelled]: "bg-red-100 text-red-700",
  }[status] || "bg-gray-100 text-gray-700");

const getStatusLabel = (status: ProjectStatus) =>
  ({
    [ProjectStatus.Active]: "Active",
    [ProjectStatus.Completed]: "Completed",
    [ProjectStatus.OnHold]: "On Hold",
    [ProjectStatus.Cancelled]: "Cancelled",
  }[status] || "N/A");

const getProgressBarClass = (rate: number) => {
  if (rate === 100) return "bg-green-500";
  if (rate >= 75) return "bg-blue-500";
  if (rate >= 50) return "bg-yellow-500";
  return "bg-orange-500";
};

const formatRelativeDate = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
</script>