// composables/useTasks.ts
import { ref } from "vue"; // You might need this explicit import if not auto-imported

export const useTasks = () => {
  // useFetch runs immediately and provides reactive refs
  const {
    data: tasks, // tasks ref holds the data (array of ITask)
    pending, // pending ref indicates loading status
    error, // error ref holds any fetch error
    refresh, // refresh function to re-trigger the fetch
  } = useFetch<ITask[]>("/api/tasks", {
    // <ITask[]> for type safety
    default: () => [], // CRUCIAL: ensures tasks.value is always an array
  });

  // Function to create a new task
  const createTask = async (taskData: Partial<ITask>) => {
    // Use Partial<ITask> for input data
    try {
      await $fetch("/api/tasks", { method: "POST", body: taskData });
      refresh(); // Re-fetch all tasks to update the UI
    } catch (e) {
      console.error("Error creating task:", e);
      // Implement UI feedback for error (e.g., a toast notification)
      throw e; // Re-throw to allow component to catch if needed
    }
  };

  // Function to update an existing task
  const updateTask = async (id: string, updates: Partial<ITask>) => {
    try {
      await $fetch(`/api/tasks/${id}`, { method: "PATCH", body: updates });
      refresh(); // Re-fetch tasks to update the UI
    } catch (e) {
      console.error(`Error updating task ${id}:`, e);
      throw e;
    }
  };

  // Function to delete a task
  const deleteTask = async (id: string) => {
    try {
      await $fetch(`/api/tasks/${id}`, { method: "DELETE" });
      refresh(); // Re-fetch tasks to update the UI
    } catch (e) {
      console.error(`Error deleting task ${id}:`, e);
      throw e;
    }
  };

  // Return all reactive states and action functions
  return {
    tasks,
    pending,
    error,
    refresh, // Make sure 'refresh' is returned for external re-fetching
    createTask,
    updateTask,
    deleteTask,
  };
};

// You'll need an ITask interface. Assuming it's defined like this:
// This can go into types/task.d.ts or server/models/Task.ts if you share types.
interface ITask {
  _id: string; // MongoDB ObjectId
  title: string;
  description?: string;
  status: "pending" | "completed";
  dueDate?: Date;
  projectId?: string; // Optional if not all tasks have a project
  // Add other fields as per your TaskModel
}
