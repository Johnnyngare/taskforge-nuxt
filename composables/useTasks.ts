// composables/useTasks.ts - UPDATED
import { useAsyncData, useFetch } from '#app';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import { useAppToast } from '~/composables/useAppToast';
import type { ITask } from '~/types/task';
import type { IUser } from '~/types/user'; // Import IUser
import { UserRole } from '~/types/user'; // Import UserRole

export const useTasks = () => {
  const api = useApi();
  const toast = useAppToast();
  const { user, isAuthenticated } = useAuth();

  // Fetch main tasks list
  const {
    data: tasks,
    pending,
    error,
    refresh,
  } = useAsyncData<ITask[]>(
    'tasks',
    () => {
      if (!isAuthenticated.value) return Promise.resolve([]);
      // EXPECTED FIX: API directly returns ITask[]
      return api<ITask[]>('/tasks');
    },
    {
      default: () => [],
      watch: [isAuthenticated],
    }
  );

  // NEW: Fetch all field officers for task assignment dropdowns
  const { data: fieldOfficers, refresh: refreshFieldOfficers, pending: fieldOfficersPending, error: fieldOfficersError } = useAsyncData<IUser[]>(
    'fieldOfficers',
    async () => {
      if (!isAuthenticated.value) return [];
      // Call the new API endpoint to get users with 'field_officer' role
      // This will only run if authenticated.
      try {
        return api<IUser[]>(`/users?role=${UserRole.FieldOfficer}`);
      } catch (err) {
        console.error('useTasks: Failed to fetch field officers:', err);
        return [];
      }
    },
    {
      default: () => [],
      watch: [isAuthenticated], // Refresh when auth status changes
    }
  );


  const createTask = async (taskData: Partial<ITask>) => {
    await api('/tasks', { method: 'POST', body: taskData });
    await refresh();
  };

  const updateTask = async (id: string, updates: Partial<ITask>) => {
    await api(`/tasks/${id}`, { method: 'PATCH', body: updates });
    await refresh();
  };

  const deleteTask = async (id: string) => {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    await refresh();
  };

  return {
    tasks,
    pending,
    error,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    // NEW: Expose field officers for UI dropdowns
    fieldOfficers,
    fieldOfficersPending,
    fieldOfficersError,
    refreshFieldOfficers,
  };
};