// composables/useProjects.ts
import { useState } from "#app";
// Define IProject type in types/index.ts
export const useProjects = () => {
  const projects = useState("projects", () => []);

  const fetchProjects = async () => {
    const { data } = await useFetch("/api/projects");
    if (data.value) {
      projects.value = data.value;
    }
  };

  return { projects, fetchProjects };
};
