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
  id: string; // Transformed from _id
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  projectId?: string; // Should also be string (transformed from ObjectId)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string; // FIX: Add userId to ITask (owner of the task)
  assignedTo?: string; // FIX: Add assignedTo to ITask (if tasks can be assigned)
}