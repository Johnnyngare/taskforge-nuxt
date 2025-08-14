<!-- pages/dashboard/projects/[id].vue -->
<template>
  <div class="p-8">
    <div v-if="pending" class="flex justify-center py-12">
      <UiSpinner class="h-8 w-8 text-blue-600" />
      <p class="ml-2 text-blue-600">Loading project details...</p>
    </div>
    <div v-else-if="error" class="py-12 text-center text-red-500">
      <Icon
        name="heroicons:exclamation-triangle"
        class="mx-auto mb-4 h-12 w-12 text-red-500"
      />
      <h2 class="text-xl font-bold">Error Loading Project</h2>
      <p>{{ error.message }}</p>
      <FormAppButton @click="refresh" class="mt-4">Try Again</FormAppButton>
    </div>
    <div v-else-if="project">
      <NuxtLink to="/dashboard/projects" class="inline-flex items-center text-blue-600 hover:underline mb-6">
        <Icon name="heroicons:arrow-left" class="h-4 w-4 mr-2" />
        Back to Projects
      </NuxtLink>
      <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ project.name }}</h1>
      <p class="text-gray-700 mb-6">{{ project.description }}</p>

      <div class="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2">
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">Details</h3>
          <p><strong>Status:</strong> {{ getStatusLabel(project.status) }}</p>
          <p><strong>Priority:</strong> {{ getPriorityLabel(project.priority) }}</p>
          <p v-if="project.startDate"><strong>Start Date:</strong> {{ new Date(project.startDate).toLocaleDateString() }}</p>
          <p v-if="project.endDate"><strong>End Date:</strong> {{ new Date(project.endDate).toLocaleDateString() }}</p>
          <p><strong>Created:</strong> {{ new Date(project.createdAt).toLocaleDateString() }}</p>
          <p><strong>Last Updated:</strong> {{ formatRelativeDate(project.updatedAt) }}</p>
          <p><strong>Owner ID:</strong> {{ project.owner }}</p>
        </div>
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">Progress</h3>
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Tasks Completed</span>
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
      </div>

      <!-- Add more project details, tasks, etc. here -->
    </div>
    <div v-else class="py-12 text-center text-gray-500">
      <h2 class="text-xl font-bold">Project Not Found</h2>
      <p>The project you are looking for does not exist or could not be loaded.</p>
      <FormAppButton @click="navigateTo('/dashboard/projects')" class="mt-4">Go to Projects List</FormAppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAsyncData, navigateTo } from '#app';
import { createError } from 'h3';
import type { IProject } from '~/types/project';
import { ProjectStatus, ProjectPriority } from '~/types/project';
import { useAuth } from '~/composables/useAuth';
import { useNotifier } from '~/composables/useNotifier'; // FIXED: Changed '=>' to 'from'

definePageMeta({ layout: 'dashboard', middleware: '02-auth' });
useSeoMeta({
  title: 'Project Details - TaskForge',
  description: 'View and manage individual project details.',
});

const route = useRoute();
const projectId = route.params.id as string;
const { user, initialized } = useAuth();
const notifier = useNotifier();

// Fetch single project details
const { data: project, pending, error, refresh } = await useAsyncData<IProject>(
  `project-${projectId}`,
  async () => {
    if (!initialized.value || !user.value?.id) {
        notifier.error({title: "Auth Error", description: "User not authenticated."});
        throw createError({ statusCode: 401, message: "User not authenticated." });
    }

    try {
      console.log(`[ProjectDetails Page] Fetching project details for ID: ${projectId}`);
      const response = await $fetch<{ statusCode: number; message: string; project?: IProject }>(`/api/projects/${projectId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.statusCode === 200 && response.project) {
        console.log(`[ProjectDetails Page] Successfully fetched project:`, response.project.id);
        return response.project;
      } else {
        const msg = response.message || 'Project not found or unable to fetch details.';
        console.warn(`[ProjectDetails Page] API response for project ${projectId} non-200 or missing data:`, response.statusCode, response);
        notifier.error({title: `Error (${response.statusCode})`, description: msg});
        throw createError({ statusCode: response.statusCode || 500, message: msg });
      }
    } catch (err: any) {
      console.error(`[ProjectDetails Page] Error fetching project ${projectId}:`, err);
      const status = err.statusCode || err.response?.status || 500;
      const message = err.message || err.statusMessage || err.response?._data?.message || 'Failed to load project details.';
      notifier.error({title: `Error Loading Project (${status})`, description: message});
      throw createError({ statusCode: status, message: message });
    }
  },
  {
    default: () => null,
    server: true,
    client: true,
    watch: [projectId, user, initialized],
    immediate: true,
    lazy: false,
  }
);

// Helper functions (copied from pages/dashboard/projects/index.vue for consistency)
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

const getPriorityLabel = (priority: ProjectPriority) =>
  ({
    [ProjectPriority.Low]: "Low",
    [ProjectPriority.Medium]: "Medium",
    [ProjectPriority.High]: "High",
  }[priority] || "N/A");
</script>

<style scoped>
/* Add any specific styling for project details page here */
</style>