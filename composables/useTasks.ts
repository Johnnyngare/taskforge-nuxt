// composables/useTasks.ts
import { useAsyncData } from '#app';
import type { ITask } from '~/types/task';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';

export const useTasks = () => {
  const { user } = useAuth();
  const api = useApi();

  const {
    data: tasks,
    pending,
    error,
    refresh,
  } = useAsyncData<ITask[]>(
    'tasks',
    () => {
      if (!user.value) return Promise.resolve([]);
      // EXPECTED FIX: API directly returns ITask[]
      return api<ITask[]>('/tasks');
    },
    {
      default: () => [],
      watch: [user],
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
  };
};