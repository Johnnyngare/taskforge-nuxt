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

export interface ITask {
  id: string; // Use 'id' as per our last fix (transformed from _id)
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  projectId?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string; // FIX: Add userId to ITask interface, as tasks are owned by users
  assignedTo?: string; // If tasks can be assigned to other users (optional)
}