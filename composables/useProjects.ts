// composables/useProjects.ts
import { useFetch } from "#app";
// It's good practice to define a shared IProject type
// For now, we'll use a generic Record<string, any>
// You should create a types/project.ts file similar to types/task.ts

// Define a simple project type for the frontend
export interface IProject {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  totalCost?: number;
  startDate?: string;
  endDate?: string;
  owner: string;
  completionRate?: number;
}

export const useProjects = () => {
  // useFetch with a key will share the state across all components that use this composable.
  // It will only fetch the data once on the initial call.
  const {
    data: projects,
    pending,
    error,
    refresh,
  } = useFetch<IProject[]>("/api/projects", {
    key: "projects-list", // A unique key to identify this shared fetch
    default: () => [],
  });

  return { projects, pending, error, refresh };
};