<!-- pages/dashboard/tasks/[id].vue - CORRECTED goBack function -->
<template>
  <div class="p-6">
    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="h-6 w-6 animate-spin text-emerald-500" />
      <p class="ml-2 text-emerald-500">Loading task details...</p>
    </div>

    <div v-else-if="error" class="py-8 text-center">
      <p class="mb-4 text-rose-400 dark:text-rose-400">
        Failed to load task details: {{ error.statusCode ? `(${error.statusCode}) ` : '' }}{{ error.message }}
      </p>
      <UButton @click="refresh" variant="secondary"> Try Again </UButton>
      <UButton class="ml-2" @click="goBack" variant="ghost">Go Back</UButton>
    </div>

    <UCard v-else-if="task" class="shadow-md">
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ task.title }}</h1>
          <div class="flex items-center gap-2">
            <UButton icon="i-heroicons-pencil-square" size="sm" @click="openEditModal">Edit</UButton>
            <!-- Changed @click to explicitly navigate to /dashboard/tasks -->
            <UButton icon="i-heroicons-arrow-uturn-left" variant="ghost" size="sm" @click="navigateToAllTasks">Back to Tasks</UButton>
          </div>
        </div>
      </template>

      <div class="space-y-4 text-gray-800 dark:text-slate-200">
        <div>
          <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Description:</p>
          <p>{{ task.description || 'No description provided.' }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Priority:</p>
            <TaskPriorityBadge :priority="task.priority" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Status:</p>
            <UBadge :color="task.status === 'completed' ? 'emerald' : 'yellow'" :label="task.status" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Due Date:</p>
            <p>{{ task.dueDate ? formatDate(task.dueDate) : 'No due date.' }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Task Type:</p>
            <p>{{ task.taskType }}</p>
          </div>
          <div v-if="task.cost !== null && task.cost !== undefined">
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Cost:</p>
            <p>${{ task.cost.toFixed(2) }}</p>
          </div>
          <div v-if="task.project">
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Project:</p>
            <p>{{ typeof task.project === 'object' && task.project !== null ? task.project.name : task.project }}</p>
          </div>
          <div v-if="task.author">
            <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Created By:</p>
            <p>{{ task.author.name }} ({{ task.author.email }})</p>
          </div>
        </div>

        <div v-if="task.assignedTo && task.assignedTo.length > 0">
          <p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Assigned To:</p>
          <div class="flex flex-wrap gap-2 mt-1">
            <UBadge v-for="assignee in task.assignedTo" :key="typeof assignee === 'object' ? assignee.id : assignee" color="blue" variant="subtle">
              {{ typeof assignee === 'object' ? assignee.name : assignee }}
            </UBadge>
          </div>
        </div>

        <div v-if="task.taskType === TaskType.Field && task.location?.coordinates?.length === 2" class="mt-4">
          <p class="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Location:</p>
          <div style="height: 300px; width: 100%;" class="rounded-lg overflow-hidden">
            <MapBase
              height="100%"
              :zoom="13"
              :center="[task.location.coordinates[1], task.location.coordinates[0]]"
              :disable-interaction="true"
            >
              <template #default="{ leafletModule }">
                <LMarker
                  :lat-lng="[task.location.coordinates[1], task.location.coordinates[0]]"
                  :draggable="false"
                >
                  <LPopup>Task Location</LPopup>
                </LMarker>
              </template>
            </MapBase>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton @click="goBack" variant="ghost">Close</UButton>
        </div>
      </template>
    </UCard>

    <div v-else class="py-8 text-center text-slate-400">
        <p class="mb-4">Task not found or could not be loaded.</p>
        <UButton @click="navigateToAllTasks" variant="ghost">Back to Tasks</UButton>
    </div>

    <TaskEditModal
      v-model="showEditModal"
      :task="task"
      @save="handleSaveEdit"
      @cancel="closeEditModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from '#app';
import { useTasks } from '~/composables/useTasks';
import { type ITask, TaskType } from '~/types/task';
import { useAppToast } from '~/composables/useAppToast';
import TaskEditModal from '~/components/TaskEditModal.vue';
import TaskPriorityBadge from '~/components/TaskPriorityBadge.vue';
import MapBase from '~/components/MapBase.vue';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { updateTask } = useTasks();

console.log('LOG 0: Script setup for Task Details Page executing.');

const taskId = computed(() => {
  const id = route.params.id as string;
  console.log('LOG 1: Task ID from route params:', id);
  return id;
});

const { data: task, pending, error, refresh } = await useAsyncData<ITask>(
  `task-${taskId.value}`,
  async () => {
    console.log('LOG 2: useAsyncData handler executing for taskId:', taskId.value);
    if (taskId.value) {
      try {
        const result = await $fetch<ITask>(`/api/tasks/${taskId.value}`);
        console.log('LOG 3: API fetch successful, data received.');
        return result;
      } catch (e: any) {
        console.error('LOG 4: Error during API fetch in useAsyncData:', e);
        throw createError({
          statusCode: e.statusCode || 500,
          message: e.message || 'Failed to fetch task details from API.',
          fatal: false
        });
      }
    }
    console.log('LOG 5: Task ID is missing or invalid, skipping API fetch.');
    return null;
  },
  {
    watch: [taskId],
    default: () => null,
  }
);

const showEditModal = ref(false);

const openEditModal = () => {
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const handleSaveEdit = async (_taskId: string, updatedData: Partial<ITask>) => {
  if (!task.value) return;
  try {
    await updateTask(taskId.value, updatedData);
    toast.add({
      title: 'Task Saved',
      description: 'Task updated successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });
    refresh();
    closeEditModal();
  } catch (err: any) {
    console.error('Failed to save task edit:', err);
    toast.add({
      title: 'Save Failed',
      description: err.data?.message || 'Could not save task changes.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
};

const goBack = () => {
  // This is for the close button in the footer, which might use router.back if that's the desired UX
  router.back();
};

// NEW: Explicit navigation function
const navigateToAllTasks = () => {
  router.push('/dashboard/tasks');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>