// types/project.ts
import type { ITask } from '~/types/task'; // Correct type-only import

export enum ProjectStatus {
  Active = 'active',
  Completed = 'completed',
  OnHold = 'on_hold',
  Cancelled = 'cancelled',
}

export enum ProjectPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export interface IProject {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  owner: string; // User ID of the owner
  members?: string[]; // Array of User IDs
  createdAt: string;
  updatedAt: string;

  // Fields for project aggregation (calculated on backend)
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number; // 0-100 percentage
  totalTasksCost?: number;

  // Associated tasks when fetching a single project detail
  tasks?: ITask[]; // Array of ITask objects
}