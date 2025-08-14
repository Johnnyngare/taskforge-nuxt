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
  members: string[];
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

const projects: Project[] = [];

export const projectStore = {
  addProject: (newProjectData: Omit<Project, 'createdAt' | 'updatedAt' | 'id' | 'completedTasks' | 'totalTasks' | 'completionRate'> & { id?: string }): Project => {
    const projectWithDefaults: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: null,
      status: 'active',
      priority: 'medium',
      startDate: null,
      endDate: null,
      members: [],
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newProjectData,
    };
    projects.push(projectWithDefaults);
    console.log(`[ProjectStore] Added project: ${projectWithDefaults.id} by owner ${projectWithDefaults.owner}`);
    return projectWithDefaults;
  },

  getProjects: (userId: string, userRole: string): Project[] => {
    let filteredProjects = [...projects];
    if (userRole === 'admin') {
      console.log("[ProjectStore] Admin fetching all projects.");
      return filteredProjects;
    } else if (userId) {
      console.log(`[ProjectStore] User ${userId} (${userRole}) fetching owned/assigned projects.`);
      filteredProjects = filteredProjects.filter(p =>
        p.owner === userId || p.members.includes(userId)
      );
    }
    return filteredProjects;
  },

  findProjectById: (id: string, userRole: string, userId: string): Project | undefined => {
    const project = projects.find(p => p.id === id);
    if (!project) return undefined;

    if (userRole === 'admin') {
      console.log(`[ProjectStore] Admin viewing project ${id}.`);
      return project;
    }
    if (project.owner === userId || project.members.includes(userId)) {
      console.log(`[ProjectStore] User ${userId} (${userRole}) viewing project ${id} (owner/member).`);
      return project;
    }

    console.warn(`[ProjectStore] Unauthorized attempt to find project ${id} by user ${userId} (role: ${userRole}).`);
    return undefined;
  },

  updateProjectById: (id: string, updates: Partial<Project>, userRole: string, userId: string): Project | undefined => {
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) return undefined;

    const existingProject = projects[projectIndex];

    if (userRole === 'admin') {
    } else if (userRole === 'manager') {
      if (existingProject.owner !== userId) {
        console.warn(`[ProjectStore] Unauthorized attempt to update project ${id}: Not owner. User: ${userId} (role: ${userRole}).`);
        return undefined;
      }
    } else {
      console.warn(`[ProjectStore] Unauthorized attempt to update project ${id}: Insufficient role. User: ${userId} (role: ${userRole}).`);
      return undefined;
    }

    const allowedUpdates: Partial<Project> = { ...updates };
    delete allowedUpdates.id;
    delete allowedUpdates.owner;
    delete allowedUpdates.createdAt;
    delete allowedUpdates.updatedAt;

    projects[projectIndex] = {
      ...existingProject,
      ...allowedUpdates,
      updatedAt: new Date().toISOString(),
    };
    console.log(`[ProjectStore] Updated project: ${id}`);
    return projects[projectIndex];
  },

  deleteProjectById: (id: string, userRole: string, userId: string): boolean => {
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) return false;

    const existingProject = projects[projectIndex];

    if (userRole === 'admin') {
    } else if (userRole === 'manager') {
      if (existingProject.owner !== userId) {
        console.warn(`[ProjectStore] Unauthorized attempt to delete project ${id}: Not owner. User: ${userId} (role: ${userRole}).`);
        return false;
      }
    } else {
      console.warn(`[ProjectStore] Unauthorized attempt to delete project ${id}: Insufficient role. User: ${userId} (role: ${userRole}).`);
      return false;
    }

    projects.splice(projectIndex, 1);
    console.log(`[ProjectStore] Deleted project: ${id}`);
    return true;
  },
};