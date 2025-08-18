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
  projectId?: string; // Should be string (transformed from ObjectId, or plain string for in-memory)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string; // Owner of the task (creator)
  assignedTo?: string[]; // Array of string IDs
  cost?: number; // NEW: Added cost field
  project?: { // NEW: Add project object for populated data (from ref population)
    id: string;
    name: string;
    // Add other project fields needed for display if desired (e.g., status, priority)
  };
}