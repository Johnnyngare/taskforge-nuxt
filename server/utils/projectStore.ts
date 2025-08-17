// server/utils/projectStore.ts
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  startDate: string | null;
  endDate: string | null;
  owner: string;
  members: string[]; // This must be an array of strings
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for projects (will reset on server restart in development)
const projects: Project[] = []; // This should always be an array

export const projectStore = {
  addProject: (newProjectData: Omit<Project, 'createdAt' | 'updatedAt' | 'id' | 'completedTasks' | 'totalTasks' | 'completionRate'> & { id?: string }): Project => {
    console.log(`[ProjectStore.addProject] 1. Received newProjectData:`, JSON.stringify(newProjectData));

    // CRITICAL FIX: Ensure 'members' is always an array, even if newProjectData.members is undefined/null
    const safeMembers = Array.isArray(newProjectData.members) ? newProjectData.members : [];
    console.log(`[ProjectStore.addProject] 2. Processed members to be:`, safeMembers);

    const projectToPush: Project = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate a unique ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedTasks: 0,
        totalTasks: 0,
        completionRate: 0,
        // Spread newProjectData first, then explicitly set properties like 'members' to ensure consistency
        ...newProjectData,
        members: safeMembers, // CRITICAL FIX: Ensure members is definitely this array, overriding any non-array from spread
        // All other properties like name, description, status, etc., should be handled by newProjectData
    };
    console.log(`[ProjectStore.addProject] 3. Final object constructed for push:`, JSON.stringify(projectToPush));

    // Ensure the `projects` array itself is valid before pushing
    if (!Array.isArray(projects)) {
        console.error("[ProjectStore.addProject] CRITICAL ERROR: `projects` internal array is not an array. Cannot add project.");
        // You might throw an error here, or re-initialize `projects` for robustness
        // For an in-memory store, a server restart usually fixes `projects` not being an array if it somehow got corrupted.
        throw new Error("Internal project store corrupted. Please restart server.");
    }

    try {
        projects.push(projectToPush);
        console.log(`[ProjectStore.addProject] 4. Project successfully pushed to internal array. Total projects: ${projects.length}`);
    } catch (pushError) {
        console.error("[ProjectStore.addProject] 4.1 ERROR during array push operation:", pushError);
        throw pushError; // Re-throw the error
    }
    
    console.log(`[ProjectStore.addProject] 5. Returning created project.`);
    return projectToPush;
  },

  getProjects: (userId: string, userRole: string): Project[] => {
    // ... same as before ...
    let filteredProjects = [...projects];
    if (userRole === 'admin') { return filteredProjects; }
    else if (userId) { filteredProjects = filteredProjects.filter(p => p.owner === userId || p.members.includes(userId)); }
    return filteredProjects;
  },

  findProjectById: (id: string, userRole: string, userId: string): Project | undefined => {
    // ... same as before ...
    const project = projects.find(p => p.id === id); if (!project) return undefined;
    if (userRole === 'admin') { return project; }
    if (project.owner === userId || project.members.includes(userId)) { return project; }
    return undefined;
  },

  updateProjectById: (id: string, updates: Partial<Project>, userRole: string, userId: string): Project | undefined => {
    // ... same as before ...
    const projectIndex = projects.findIndex(p => p.id === id); if (projectIndex === -1) return undefined;
    const existingProject = projects[projectIndex];
    if (userRole === 'admin') { /* ... */ } else if (userRole === 'manager') { /* ... */ } else { /* ... */ }
    const allowedUpdates: Partial<Project> = { ...updates }; /* ... */
    projects[projectIndex] = { ...existingProject, ...allowedUpdates, updatedAt: new Date().toISOString() };
    return projects[projectIndex];
  },

  deleteProjectById: (id: string, userRole: string, userId: string): boolean => {
    // ... same as before ...
    const projectIndex = projects.findIndex(p => p.id === id); if (projectIndex === -1) return false;
    const existingProject = projects[projectIndex];
    if (userRole === 'admin') { /* ... */ } else if (userRole === 'manager') { /* ... */ } else { /* ... */ }
    projects.splice(projectIndex, 1);
    return true;
  },
};