// types/project.ts
export enum ProjectStatus {
  Active = "active",
  OnHold = "on_hold",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum ProjectPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export interface IProject {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  owner: string;
  members?: string[];
  createdAt: string;
  updatedAt: string;
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}