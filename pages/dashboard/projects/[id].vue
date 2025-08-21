<!-- pages/dashboard/projects/[id].vue -->
<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <UiSpinner class="h-8 w-8 text-emerald-500" />
      <p class="ml-2 text-emerald-500">Loading project details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !project" class="py-12 text-center">
      <Icon
        name="heroicons:exclamation-triangle"
        class="mx-auto mb-4 h-12 w-12 text-rose-400"
      />
      <h2 class="text-xl font-bold text-rose-400">Error Loading Project</h2>
      <p class="text-slate-400">
        {{ error?.message || 'The project could not be found or you may not have permission to view it.' }}
      </p>
      <FormAppButton @click="refresh" class="mt-4">Try Again</FormAppButton>
    </div>

    <!-- Success State -->
    <div v-else-if="project">
      <NuxtLink
        to="/dashboard/projects"
        class="mb-6 inline-flex items-center text-emerald-400 hover:underline"
      >
        <Icon name="heroicons:arrow-left" class="mr-2 h-4 w-4" />
        Back to All Projects
      </NuxtLink>

      <!-- Main Project Title (Dynamic) -->
      <h1 class="mb-4 text-3xl font-bold text-white">{{ project.name }}</h1>
      <p class="mb-6 text-slate-400">{{ project.description }}</p>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <!-- Left Column: Details -->
        <div class="space-y-2 rounded-lg bg-slate-800 p-4">
          <h3 class="mb-2 font-semibold text-slate-200">Details</h3>
          <p><strong>Status:</strong> {{ project.status }}</p>
          <p><strong>Priority:</strong> {{ project.priority }}</p>
          <p v-if="project.startDate">
            <strong>Start Date:</strong>
            {{ new Date(project.startDate).toLocaleDateString() }}
          </p>
          <p v-if="project.endDate">
            <strong>End Date:</strong>
            {{ new Date(project.endDate).toLocaleDateString() }}
          </p>
          <p v-if="typeof project.budget === 'number'">
            <strong>Budget:</strong> ${{ project.budget.toLocaleString() }}
          </p>
          <p v-if="typeof project.totalTasksCost === 'number'">
            <strong>Tasks Cost:</strong> ${{ project.totalTasksCost.toLocaleString() }}
          </p>
          <p>
            <strong>Created:</strong>
            {{ new Date(project.createdAt).toLocaleDateString() }}
          </p>
          <p>
            <strong>Last Updated:</strong>
            {{ formatRelativeDate(project.updatedAt) }}
          </p>
          <p v-if="project.owner"><strong>Owner ID:</strong> {{ project.owner }}</p>
        </div>

        <!-- Right Column: Progress -->
        <div class="rounded-lg bg-slate-800 p-4">
          <h3 class="mb-2 font-semibold text-slate-200">Progress</h3>
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium text-slate-300"
              >Tasks Completed</span
            >
            <span class="text-sm text-slate-400">
              {{ project.completedTasks || 0 }} / {{ project.totalTasks || 0 }}
            </span>
          </div>
          <div class="h-2 w-full rounded-full bg-slate-700">
            <div
              class="h-2 rounded-full bg-emerald-500 transition-all duration-300"
              :style="{ width: `${project.completionRate || 0}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Associated Tasks Section -->
      <div class="mt-8">
        <h2 class="text-xl font-semibold text-slate-200">Tasks in this Project</h2>
        <div v-if="project.tasks && project.tasks.length > 0">
          <TaskList :tasks="project.tasks" :selected-task-id="null" /> <!-- Pass null -->
        </div>
        <div v-else class="mt-4 rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-500">
          <p>No tasks have been added to this project yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useAsyncData } from '#app';
import type { IProject } from '~/types/project';
import { useApi } from '~/composables/useApi';
import TaskList from '~/components/TaskList.vue'; // Ensure TaskList is imported

definePageMeta({ layout: 'dashboard' });

const route = useRoute();
const api = useApi();

const projectId = computed(() => route.params.id as string);

const {
  data: project,
  pending,
  error,
  refresh,
} = await useAsyncData<IProject | null>(
  `project-${projectId.value}`,
  () => {
    if (!projectId.value) {
      return Promise.resolve(null);
    }
    return api<IProject>(`/projects/${projectId.value}`);
  },
  {
    default: () => null,
    watch: [projectId],
  }
);

useSeoMeta({
  title: computed(() =>
    project.value ? `${project.value.name} - TaskForge` : 'Project Details'
  ),
});

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
</script>