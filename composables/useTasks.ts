// composables/useTasks.ts
import { useFetch, useNuxtApp } from "#app";
// FIX: Import the global ITask type
import type { ITask } from "~/types/task";

export const useTasks = () => {
  const nuxtApp = useNuxtApp();

  const {
    data: tasks,
    pending,
    error,
    refresh,
  } = useFetch<ITask[]>("/api/tasks", {
    default: () => [],
  });

  const createTask = async (taskData: Partial<Omit<ITask, "_id">>) => {
    // ... (createTask implementation is good, no changes needed)
    try {
      const newTask = await $fetch<ITask>("/api/tasks", {
        method: "POST",
        body: taskData,
      });
      if (tasks.value) {
        tasks.value.push(newTask);
      }
      return newTask;
    } catch (e: any) {
      // ... error handling
      throw e;
    }
  };

  const updateTask = async (id: string, updates: Partial<ITask>) => {
    try {
      // FIX: Use PATCH method to align with our new API endpoint
      const updatedTask = await $fetch<ITask>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: updates,
      });

      if (tasks.value) {
        const index = tasks.value.findIndex((t) => t._id === id);
        if (index !== -1) {
          // FIX: A more robust way to update the object to ensure reactivity
          tasks.value[index] = { ...tasks.value[index], ...updatedTask };
        }
      }
      return updatedTask;
    } catch (e: any) {
      // ... (error handling is good, no changes needed)
      throw e;
    }
  };

  const deleteTask = async (id: string) => {
    // ... (deleteTask implementation is good, no changes needed)
    try {
      await $fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (tasks.value) {
        tasks.value = tasks.value.filter((t) => t._id !== id);
      }
    } catch (e: any) {
      // ... error handling
      throw e;
    }
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
