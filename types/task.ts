// types/task.ts
// Assuming basic types are defined elsewhere or not needed here:
// export interface IUser { /* ... */ }

export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

// GeoJSON types for location
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export enum TaskType {
  Office = 'office',
  Field = 'field',
}

// The ITask interface
export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO string date
  userId: string; // ID of the user who owns the task
  projectId?: string; // ID of the project it belongs to (optional)
  assignedTo?: string[]; // Array of User IDs assigned to this task
  cost?: number; // Optional cost for the task
  taskType: TaskType; // 'office' or 'field'
  location?: GeoJSONPoint; // GeoJSON data for field tasks

  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date

  // For populated fields from backend
  project?: {
    id: string;
    name: string;
  };
  author?: { // Assumed author details for consistency with SOPs
    id: string;
    name: string;
  };
}