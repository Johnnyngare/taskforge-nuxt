// composables/useTasks.ts
import { readonly, watch, computed } from 'vue'
import { useAsyncData, useFetch } from '#app' // Ensure useAsyncData is imported
import type { ITask } from '~/types/task'
import { useAuth } from '~/composables/useAuth'
import { createError } from 'h3'; // For throwing h3 errors from composable
import { useNotifier } from '~/composables/useNotifier';

interface ApiResponse {
  statusCode?: number;
  message?: string;
  task?: ITask;
  tasks?: ITask[];
  errors?: any;
}

export const useTasks = () => {
  const { user, initialized } = useAuth(); // Get user and initialized state
  const notifier = useNotifier();

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
        // Fetch tasks for the current user. Add query parameters for filtering by projectId.
        const response: ApiResponse = await $fetch('/api/tasks', {
          method: 'GET',
          baseURL: '/', // Your base URL
          query: {
            // Backend will use ctxUser for RBAC, but optional query for filtering.
            // projectId: 'someProjectId' // Example: if you want to filter by project
          },
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
      server: true,
      client: true,
      watch: [user, initialized], // Re-fetch when user or auth initialized state changes
      immediate: true,
      lazy: false,
    }
  )

  // --- Task CRUD Operations ---

  const createTask = async (taskData: Partial<ITask>): Promise<ApiResponse> => {
    if (!user.value?.id) {
      const msg = "Unauthorized: Cannot create task without authenticated user.";
      console.error("useTasks: createTask failed - " + msg);
      notifier.error({ title: "Permission Denied", description: msg });
      return { statusCode: 401, message: msg };
    }
    try {
      console.log('useTasks: Attempting to create task with payload:', taskData);
      const response: ApiResponse = await $fetch('/api/tasks', {
        method: 'POST',
        baseURL: '/',
        body: { ...taskData, userId: user.value.id }, // Ensure userId (creator) is set
        credentials: 'include'
      });

      if (response.statusCode === 201 && response.task) {
        console.log('useTasks: Task created successfully:', response.task.id);
        if (tasks.value) { tasks.value = [response.task, ...tasks.value]; }
        return response;
      } else {
        const msg = response.message || 'Failed to create task (API response problem).';
        console.error('useTasks: API responded unexpectedly during create:', response.statusCode, response);
        notifier.error({ title: `Task Creation Failed (${response.statusCode || 'Unknown'})`, description: msg });
        return { statusCode: response.statusCode || 500, message: msg, errors: response.errors };
      }
    } catch (e: any) {
      const status = e.response?.status || 500;
      const message = e.response?._data?.message || e.message || 'Network or server error during task creation.';
      console.error(`useTasks: Error creating task (Status: ${status}):`, message, e.response?._data);
      notifier.error({ title: `Task Creation Failed (${status})`, description: message });
      return { statusCode: status, message: message, errors: e.response?._data?.errors };
    }
  }

  const updateTask = async (id: string, updates: Partial<ITask>): Promise<ApiResponse> => {
    if (!id) {
      const msg = "Missing task ID for update.";
      console.error("useTasks: updateTask failed - " + msg);
      notifier.error({ title: "Update Failed", description: msg });
      return { statusCode: 400, message: msg };
    }
    if (!user.value?.id) { // Basic auth check
      const msg = "Unauthorized: Cannot update task without authenticated user.";
      console.error("useTasks: updateTask failed - " + msg);
      notifier.error({ title: "Permission Denied", description: msg });
      return { statusCode: 401, message: msg };
    }

    try {
      console.log(`useTasks: Attempting to update task ${id} with updates:`, updates);
      const response: ApiResponse = await $fetch(`/api/tasks/${id}`, {
        method: 'PATCH', // Assuming PATCH for partial updates
        baseURL: '/',
        body: updates,
        credentials: 'include'
      });

      if (response.statusCode === 200 && response.task) {
        console.log(`useTasks: Task ${id} updated successfully.`);
        if (tasks.value) { tasks.value = (tasks.value as ITask[]).map((t: ITask) => t.id === id ? response.task! : t); }
        return response;
      } else {
        const msg = response.message || 'Failed to update task (API response problem).';
        console.error('useTasks: API responded unexpectedly during update:', response.statusCode, response);
        notifier.error({ title: `Task Update Failed (${response.statusCode || 'Unknown'})`, description: msg });
        return { statusCode: response.statusCode || 500, message: msg, errors: response.errors };
      }
    } catch (e: any) {
      const status = e.response?.status || 500;
      const message = e.response?._data?.message || e.message || 'Network or server error during task update.';
      console.error(`useTasks: Error updating task (Status: ${status}):`, message, e.response?._data);
      notifier.error({ title: `Task Update Failed (${status})`, description: message });
      return { statusCode: status, message: message, errors: e.response?._data?.errors };
    }
  }

  const deleteTask = async (id: string): Promise<ApiResponse> => {
    if (!id) {
      const msg = "Missing task ID for delete.";
      console.error("useTasks: deleteTask failed - " + msg);
      notifier.error({ title: "Deletion Failed", description: msg });
      return { statusCode: 400, message: msg };
    }
    if (!user.value?.id) { // Basic auth check
      const msg = "Unauthorized: Cannot delete task without authenticated user.";
      console.error("useTasks: deleteTask failed - " + msg);
      notifier.error({ title: "Permission Denied", description: msg });
      return { statusCode: 401, message: msg };
    }

    try {
      console.log(`useTasks: Attempting to delete task ${id}.`);
      const response: ApiResponse = await $fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        baseURL: '/',
        credentials: 'include'
      });

      if (response.statusCode === 200) {
        console.log(`useTasks: Task ${id} deleted successfully.`);
        if (tasks.value) { tasks.value = (tasks.value as ITask[]).filter((t: ITask) => t.id !== id); }
        return response;
      } else {
        const msg = response.message || 'Failed to delete task (API response problem).';
        console.error('useTasks: API responded unexpectedly during delete:', response.statusCode, response);
        notifier.error({ title: `Task Deletion Failed (${response.statusCode || 'Unknown'})`, description: msg });
        return { statusCode: response.statusCode || 500, message: msg, errors: response.errors };
      }
    } catch (e: any) {
      const status = e.response?.status || 500;
      const message = e.response?._data?.message || e.message || 'Network or server error during task deletion.';
      console.error(`useTasks: Error deleting task (Status: ${status}):`, message, e.response?._data);
      notifier.error({ title: `Task Deletion Failed (${status})`, description: message });
      return { statusCode: status, message: message, errors: e.response?._data?.errors };
    }
  }

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