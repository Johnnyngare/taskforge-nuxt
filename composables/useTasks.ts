// composables/useTasks.ts
import { ref } from "vue";
import { useFetch } from "#app";

// Define the ITask interface directly here for clarity and type safety.
// It's best practice to move this to a `types/task.d.ts` file for global access.
export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export const useTasks = () => {
  // useFetch provides reactive data, pending, error, and refresh refs.
  const {
    data: tasks,
    pending,
    error,
    refresh,
  } = useFetch<ITask[]>("/api/tasks", {
    // CRUCIAL FIX for hydration errors: Provide a default empty array.
    // This ensures `tasks.value` is never null on the server or client initially.
    default: () => [],
  });

  // Function to create a new task
  const createTask = async (taskData: Partial<ITask>) => {
    try {
      const newTask = await $fetch<ITask>("/api/tasks", {
        method: "POST",
        body: taskData,
      });

      // Optimistic UI Update: Add the new task to the local state immediately.
      if (tasks.value) {
        tasks.value.push(newTask);
      }
      return newTask;
    } catch (e: any) {
      const errorMessage =
        e.data?.message || e.message || "Failed to create task.";
      console.error("Error creating task:", errorMessage, e);
      throw new Error(errorMessage); // Re-throw for the component to handle
    }
  };

  // Function to update an existing task
  const updateTask = async (id: string, updates: Partial<ITask>) => {
    try {
      const updatedTask = await $fetch<ITask>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: updates,
      });

      // Optimistic UI Update: Find and replace the task in the local state.
      if (tasks.value) {
        const index = tasks.value.findIndex((t) => t._id === id);
        if (index !== -1) {
          tasks.value[index] = { ...tasks.value[index], ...updatedTask };
        }
      }
    } catch (e: any) {
      const errorMessage =
        e.data?.message || e.message || `Failed to update task ${id}.`;
      console.error(`Error updating task ${id}:`, errorMessage, e);
      throw new Error(errorMessage);
    }
  };

  // Function to delete a task
  const deleteTask = async (id: string) => {
    try {
      await $fetch(`/api/tasks/${id}`, { method: "DELETE" });

      // Optimistic UI Update: Remove the task from the local state.
      if (tasks.value) {
        tasks.value = tasks.value.filter((t) => t._id !== id);
      }
    } catch (e: any) {
      const errorMessage =
        e.data?.message || e.message || `Failed to delete task ${id}.`;
      console.error(`Error deleting task ${id}:`, errorMessage, e);
      throw new Error(errorMessage);
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
