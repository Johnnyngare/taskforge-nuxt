// composables/useProjects.ts
import { readonly, computed } from 'vue' // FIX: Remove watch as it's not used
import { useFetch } from '#imports'
import type { IProject } from '~/types/project'
import { useAuth } from '~/composables/useAuth'

export const useProjects = () => {
  const { user, initialized: _initialized } = useAuth() // FIX: Prefix initialized with _ if unused

  const {
    data: projects,
    pending,
    error,
    refresh
  } = useFetch<IProject[]>('/api/projects', {
    method: 'GET',
    baseURL: '/',
    immediate: true, // Fetch data on component mount/SSR
    key: computed(() => `projects-for-${user.value?.id || 'guest'}`), 
    
    query: computed(() => ({
      userId: user.value?.id || '' 
    })),
    
    server: true, 
    client: true, 

    default: () => [] as IProject[], 
    
    onResponseError({ request, response, options: _options }) { // FIX: Prefix options with _
      const requestUrl = (request as any)?.url || String(request) || 'unknown URL';
      console.error(`useProjects: API Error for ${requestUrl}:`, response?.status, response?.statusText, response?._data);
    },
  })

  // The explicit watch for user is no longer needed here as useFetch is immediate and reactive to query.
  // if you want this removed.

  return {
    projects: readonly(projects),
    pending,
    error,
    refresh
  }
}