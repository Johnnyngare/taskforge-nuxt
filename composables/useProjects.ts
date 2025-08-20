// composables/useProjects.ts
import { useAsyncData } from '#app';
import type { IProject } from '~/types/project';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';

export const useProjects = () => {
  const { user } = useAuth();
  const api = useApi();

  const {
    data: projects,
    pending,
    error,
    refresh,
  } = useAsyncData<IProject[]>(
    'projects',
    () => {
      if (!user.value) return Promise.resolve([]);
      // EXPECTED FIX: API directly returns IProject[]
      return api<IProject[]>('/projects');
    },
    {
      default: () => [],
      watch: [user],
    }
  );

  const createProject = async (projectData: Partial<IProject>) => {
    await api('/projects', { method: 'POST', body: projectData });
    await refresh();
  };

  const updateProject = async (id: string, updates: Partial<IProject>) => {
    await api(`/projects/${id}`, { method: 'PATCH', body: updates });
    await refresh();
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await api('/projects/${id}', { method: 'DELETE' });
    await refresh();
  };

  return {
    projects,
    pending,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
  };
};