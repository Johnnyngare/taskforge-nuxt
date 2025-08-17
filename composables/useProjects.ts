// composables/useProjects.ts
import { readonly, computed } from 'vue';
import { useAsyncData, useRuntimeConfig } from '#app';
import { createError } from 'h3';
import type { IProject } from '~/types/project';
import { useAuth } from '~/composables/useAuth';
import { useNotifier } from '~/composables/useNotifier';

interface ApiResponse {
  statusCode: number;
  message: string;
  project?: IProject;
  projects?: IProject[];
  errors?: any;
}

export const useProjects = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || '';

  const { user, initialized } = useAuth();
  const notifier = useNotifier();

  // --- Project List Fetching ---
  const { data: projects, pending, error, refresh } = useAsyncData<IProject[]>(
    'projects',
    async () => {
      if (!initialized.value || !user.value?.id) {
        console.warn('useProjects: Project list fetch skipped. User not initialized or authenticated.');
        return [];
      }
      try {
        console.log(`useProjects: Initiating fetch for projects for user ${user.value.id}`);
        const response: ApiResponse = await $fetch('/api/projects', {
          method: 'GET',
          baseURL: apiBase,
          credentials: 'include',
        });

        if (response.statusCode === 200 && response.projects) {
          console.log(`useProjects: Successfully fetched ${response.projects.length} projects.`);
          return response.projects;
        } else {
          const errorMessage = response.message || 'Failed to fetch projects (API response problem).';
          console.error('useProjects: API responded unexpectedly during fetch:', response.statusCode, response);
          if (process.client) {
            notifier.error({
              title: `Error Loading Projects (${response.statusCode || 'Unknown'})`,
              description: errorMessage,
            });
          }
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        const status = err.response?.status || 500;
        const message = err.response?._data?.message || err.message || 'Network or server error during project list fetch.';
        console.error(`useProjects: Error during project list fetch (Status: ${status}):`, message, err.response?._data);
        if (process.client) {
          notifier.error({
            title: `Failed to Load Projects (${status})`,
            description: message,
          });
        }
        throw createError({ statusCode: status, statusMessage: message });
      }
    },
    {
      default: () => [],
      server: true,
      client: true,
      watch: [
        () => user.value?.id,
        initialized
      ],
      immediate: true,
      lazy: false,
    }
  );

  // --- Project CRUD Operations ---

  const createProject = async (payload: Partial<IProject>): Promise<ApiResponse> => {
    // FIXED: Moved console.log inside the function
    console.log('useProjects: createTask method called.'); // <--- MOVED HERE

    if (!user.value || !user.value.id || (user.value.role !== 'admin' && user.value.role !== 'manager' && user.value.role !== 'dispatcher')) {
      const msg = 'Forbidden: Your role does not permit project creation.';
      console.error('useProjects: createProject failed - ' + msg);
      notifier.error({ title: "Permission Denied", description: msg });
      return { statusCode: 403, message: msg };
    }

    try {
      console.log('useProjects: Attempting to create project with payload:', payload);
      const response: ApiResponse = await $fetch('/api/projects', {
        method: 'POST',
        baseURL: apiBase,
        body: { ...payload, owner: user.value.id, members: payload.members || [user.value.id] },
        credentials: 'include',
      });

      if (response.statusCode === 201 && response.project) {
        console.log('useProjects: Project created successfully:', response.project.id);
        if (Array.isArray(projects.value)) {
          projects.value = [response.project, ...projects.value];
        }
        return response;
      } else {
        const msg = response.message || 'Failed to create project (API response problem).';
        console.error('useProjects: API responded unexpectedly during create:', response.statusCode, response);
        notifier.error({
          title: `Project Creation Failed (${response.statusCode || 'Unknown'})`,
          description: msg,
        });
        return { statusCode: response.statusCode || 500, message: msg, errors: response.errors };
      }
    } catch (e: any) {
      const status = e.response?.status || 500;
      const message = e.response?._data?.message || e.message || 'Network or server error during project creation.';
      console.error(`useProjects: Error creating project (Status: ${status}):`, message, e.response?._data);
      notifier.error({
        title: `Project Creation Failed (${status})`,
        description: message,
      });
      return { statusCode: status, message: message, errors: e.response?._data?.errors };
    }
  };

  const updateProject = async (id: string, updates: Partial<IProject>): Promise<ApiResponse> => { /* ... */ return {} as ApiResponse; };
  const deleteProject = async (id: string): Promise<ApiResponse> => { /* ... */ return {} as ApiResponse; };

  return {
    projects: readonly(projects),
    pending,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
  };
};