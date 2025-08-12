// composables/useProjects.ts
import { readonly, computed, watch } from 'vue'
import { useFetch } from '#imports'
import type { IProject } from '~/types/project'
import { useAuth } from '~/composables/useAuth'


export const useProjects = () => {
  const { user, initialized } = useAuth() 

  const {
    data: projects,
    pending,
    error,
    refresh
  } = useFetch<IProject[]>('/api/projects', { 
    method: 'GET',
    baseURL: '/',
    immediate: true, 
    key: computed(() => `projects-for-${user.value?.id || 'guest'}`), 
    
    query: computed(() => ({
      userId: user.value?.id || '' 
    })),
    
    server: true, 
    client: true, 

    default: () => [] as IProject[], 
    
    onResponseError({ request, response }) { 
      const requestUrl = (request as any)?.url || String(request) || 'unknown URL';
      console.error(`useProjects: API Error for ${requestUrl}:`, response?.status, response?.statusText, response?._data);
    },
  })


  return {
    projects: readonly(projects),
    pending,
    error,
    refresh
  }
}