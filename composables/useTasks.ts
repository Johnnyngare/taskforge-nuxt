// composables/useTasks.ts
import { useFetch, useNuxtApp } from "#app";
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

  const createTask = async (taskData: Partial<Omit<ITask, "id">>) => {
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
      throw e;
    }
  };

  const updateTask = async (id: string, updates: Partial<ITask>) => {
    try {
      const updatedTask = await $fetch<ITask>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: updates,
      });

      if (tasks.value) {
        // FIX: Find by 'id' instead of '_id'
        const index = tasks.value.findIndex((t) => t.id === id);
        if (index !== -1) {
          tasks.value[index] = updatedTask;
        }
      }
      return updatedTask;
    } catch (e: any) {
      throw e;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await $fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (tasks.value) {
        // FIX: Filter by 'id' instead of '_id'
        tasks.value = tasks.value.filter((t) => t.id !== id);
      }
    } catch (e: any) {
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