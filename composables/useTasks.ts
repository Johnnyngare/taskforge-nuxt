// composables/useTasks.ts
import { readonly, watch, computed } from 'vue'
import { useFetch } from '#imports'
import type { ITask } from '~/types/task'
import { useAuth } from '~/composables/useAuth'

export const useTasks = () => {
  const { user } = useAuth() 
  // const toast = useToast(); // This relies on Nuxt auto-import. Keep this line if used elsewhere.
  
  const {
    data: tasks,
    pending,
    error,
    refresh
  } = useFetch<ITask[]>('/api/tasks', { 
    method: 'GET',
    baseURL: '/',
    immediate: true, 
    key: `tasks-for-${user.value?.id || 'guest'}`, 
    
    query: {
      userId: computed(() => user.value?.id) 
    },
    
    server: true, 
    client: true, 

    default: () => [] as ITask[], 
    
    onResponseError({ request, response }) { 
      const requestUrl = (request as any)?.url || String(request) || 'unknown URL';
      console.error(`useTasks: API Error for ${requestUrl}:`, response?.status, response?.statusText, response?._data);
      
    },
  })

  // The explicit watch for user is no longer needed.

  const createTask = async (taskData: Partial<ITask>) => { 
    const newTask = await $fetch<ITask>('/api/tasks', {
      method: 'POST',
      body: { ...taskData, userId: user.value?.id }, 
      credentials: 'include'
    })
    // Optimistic update: Create a NEW array and assign it.
    if (Array.isArray(tasks.value)) { 
      tasks.value = [newTask, ...(tasks.value)]; 
    } else {
      tasks.value = [newTask]; 
    }
    return newTask
  }

  const updateTask = async (id: string, updates: Partial<ITask>) => {
    const updatedTask = await $fetch<ITask>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: updates,
      credentials: 'include'
    })
    // Optimistic update: Create a NEW array and assign it.
    if (Array.isArray(tasks.value)) {
      const idx = tasks.value.findIndex((t: ITask) => t.id === id) 
      if (idx !== -1) {
        tasks.value[idx] = updatedTask
      }
    }
    return updatedTask
  }

  const deleteTask = async (id: string) => {
    await $fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    // Optimistic update: Create a NEW array and assign it.
    if (Array.isArray(tasks.value)) {
      tasks.value = tasks.value.filter((t: ITask) => t.id !== id);
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