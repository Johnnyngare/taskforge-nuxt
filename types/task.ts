// types/task.ts

export enum TaskStatus {
  Pending = "pending",
  Completed = "completed",
  InProgress = "in_progress",
  Cancelled = "cancelled",
}

export enum TaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent",
}

// This is the single, definitive interface for the frontend.
// It uses strings for IDs and dates, as received from the API's JSON response.
export interface ITask {
  id: string; // Use 'id' as per our last fix
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  projectId?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}