// composables/useTasks.ts
import { readonly, watch, computed } from 'vue'
import { useFetch } from '#imports'
import type { ITask } from '~/types/task'
import { useAuth } from '~/composables/useAuth'

export const useTasks = () => {
  const { user } = useAuth() 
  
  const {
    data: tasks, // This is the Ref<ITask[] | null>
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

    default: () => [] as ITask[], // Initial default value
    
    onResponseError({ request, response, options: _options }) { 
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
    // FIX: Ensure tasks.value is an array, then create a new array.
    if (tasks.value) { // Check if it's not null/undefined
      tasks.value = [newTask, ...(tasks.value as ITask[])]; // Cast to ITask[] for spread
    } else {
      tasks.value = [newTask]; // Initialize if null
    }
    return newTask
  }

  const updateTask = async (id: string, updates: Partial<ITask>) => {
    // Add a guard to ensure ID is valid before making the request
    if (!id) {
        console.error("useTasks: updateTask called with undefined/null ID.");
        throw new Error("Task ID is missing for update.");
    }
    const updatedTask = await $fetch<ITask>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: updates,
      credentials: 'include'
    })
    // FIX: Optimistic update: Create a NEW array and assign it.
    if (tasks.value) { // Check if it's not null/undefined
      // Find the index of the task and replace it by creating a new array
      tasks.value = (tasks.value as ITask[]).map((t: ITask) => t.id === id ? updatedTask : t);
    }
    return updatedTask
  }

  const deleteTask = async (id: string) => {
    // Add a guard to ensure ID is valid before making the request
    if (!id) {
        console.error("useTasks: deleteTask called with undefined/null ID.");
        throw new Error("Task ID is missing for delete.");
    }
    await $fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    // FIX: Optimistic update: Create a NEW array and assign it.
    if (tasks.value) { // Check if it's not null/undefined
      tasks.value = (tasks.value as ITask[]).filter((t: ITask) => t.id !== id);
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