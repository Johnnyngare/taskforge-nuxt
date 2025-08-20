// composables/useTasks.ts
import { readonly, watch, computed } from 'vue'
import { useAsyncData } from '#app'
import type { ITask } from '~/types/task'
import { useAuth } from '~/composables/useAuth'
import { createError } from 'h3';
import { useNotifier } from '~/composables/useNotifier';

interface ApiResponse {
  statusCode?: number;
  message?: string;
  task?: ITask; // For single task operations (create, update)
  tasks?: ITask[]; // For list operations (get)
  errors?: any;
}

export const useTasks = () => {
  const { user, initialized } = useAuth(); // Get user and initialized state
  const notifier = useNotifier(); // For composable's internal error reporting

  // --- Task List Fetching ---
  const {
    data: tasks,
    pending,
    error,
    refresh
  } = useAsyncData<ITask[]>(
    'tasks',
    async () => {
      // Only fetch if useAuth reports being initialized and having a user.
      if (!initialized.value || !user.value?.id) {
        console.warn('useTasks: Task list fetch skipped. User not initialized or authenticated.');
        return [];
      }
      try {
        console.log(`useTasks: Initiating fetch for tasks for user ${user.value.id}`);
        const response: ApiResponse = await $fetch('/api/tasks', {
          method: 'GET',
          baseURL: '/', // Your base URL is implicitly `/` for Nuxt API routes
          credentials: 'include'
        });

        if (response.statusCode === 200 && response.tasks) {
          console.log(`useTasks: Successfully fetched ${response.tasks.length} tasks.`);
          return response.tasks;
        } else {
          const errorMessage = response.message || 'Failed to fetch tasks (API response problem).';
          console.error('useTasks: API responded unexpectedly during fetch:', response.statusCode, response);
          if (process.client) { notifier.error({ title: `Error Loading Tasks (${response.statusCode || 'Unknown'})`, description: errorMessage, }); }
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        const status = err.response?.status || 500;
        const message = err.response?._data?.message || err.message || 'Network or server error during task list fetch.';
        console.error(`useTasks: Error during task list fetch (Status: ${status}):`, message, err.response?._data);
        if (process.client) { notifier.error({ title: `Failed to Load Tasks (${status})`, description: message, }); }
        throw createError({ statusCode: status, statusMessage: message });
      }
    },
    {
      default: () => [],
      server: false, // Set to false, use refresh for client-side fetches
      client: true,
      // CRITICAL FIX: Watch `user.value?.id` with a getter function for correct reactivity
      watch: [
        () => user.value?.id, // Watch for changes in user.value.id (ensures it's a stable string ID)
        initialized           // Watch initialized directly (it's a ref<boolean>)
      ],
      immediate: true, // Keep immediate true; the watch condition provides the guard
      lazy: false,
    }
  )

  // --- Task CRUD Operations Implementations ---

  const createTask = async (taskData: Partial<ITask>): Promise<ApiResponse> => {
    try {
      console.log('useTasks: Calling /api/tasks (POST) with data:', taskData);
      const response: ApiResponse = await $fetch('/api/tasks', {
        method: 'POST',
        body: taskData,
        credentials: 'include',
      });

      if (response.statusCode === 201 && response.task) {
        console.log('useTasks: Task created successfully via API.');
        return response;
      } else {
        const errorMessage = response.message || 'Failed to create task (API response problem).';
        // Use notifier for internal composable errors, components use direct toast
        if (process.client) { notifier.error({ title: `Error Creating Task (${response.statusCode || 'Unknown'})`, description: errorMessage }); }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const status = err.response?.status || 500;
      const message = err.response?._data?.message || err.message || 'Network or server error during task creation.';
      console.error(`useTasks: Error creating task (Status: ${status}):`, message, err.response?._data);
      if (process.client) { notifier.error({ title: `Failed to Create Task (${status})`, description: message }); }
      throw createError({ statusCode: status, statusMessage: message });
    }
  };

  const updateTask = async (id: string, updates: Partial<ITask>): Promise<ApiResponse> => {
    try {
      console.log(`useTasks: Calling /api/tasks/${id} (PATCH) with data:`, updates);
      const response: ApiResponse = await $fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: updates,
        credentials: 'include',
      });

      if (response.statusCode === 200 && response.task) {
        console.log('useTasks: Task updated successfully via API.');
        return response;
      } else {
        const errorMessage = response.message || 'Failed to update task (API response problem).';
        if (process.client) { notifier.error({ title: `Error Updating Task (${response.statusCode || 'Unknown'})`, description: errorMessage }); }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const status = err.response?.status || 500;
      const message = err.response?._data?.message || err.message || 'Network or server error during task update.';
      console.error(`useTasks: Error updating task (Status: ${status}):`, message, err.response?._data);
      if (process.client) { notifier.error({ title: `Failed to Update Task (${status})`, description: message }); }
      throw createError({ statusCode: status, statusMessage: message });
    }
  };

  const deleteTask = async (id: string): Promise<ApiResponse> => {
    try {
      console.log(`useTasks: Calling /api/tasks/${id} (DELETE)`);
      const response: ApiResponse = await $fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.statusCode === 200) {
        console.log('useTasks: Task deleted successfully via API.');
        return response;
      } else {
        const errorMessage = response.message || 'Failed to delete task (API response problem).';
        if (process.client) { notifier.error({ title: `Error Deleting Task (${response.statusCode || 'Unknown'})`, description: errorMessage }); }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const status = err.response?.status || 500;
      const message = err.response?._data?.message || err.message || 'Network or server error during task deletion.';
      console.error(`useTasks: Error deleting task (Status: ${status}):`, message, err.response?._data);
      if (process.client) { notifier.error({ title: `Failed to Delete Task (${status})`, description: message }); }
      throw createError({ statusCode: status, statusMessage: message });
    }
  };

  return {
    tasks: readonly(tasks),
    pending,
    error,
    refresh,
    createTask,
    updateTask,
    deleteTask
  }
}