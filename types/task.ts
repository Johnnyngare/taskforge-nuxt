// types/task.ts
export enum TaskStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum TaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent",
}

// NEW: TaskType Enum
export enum TaskType {
  Office = "office",
  Field = "field",
}

// NEW: GeoJSON Point structure
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

// Update the ITask interface to include new fields
export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // The ID of the user who created the task
  assignedTo?: string[]; // IDs of users assigned to this task
  projectId?: string; // ID of the project this task belongs to
  project?: {
    id: string;
    name: string;
  }; // Populated project details for display
  cost?: number; // Optional cost for the task

  // NEW MAPPING FIELDS
  taskType: TaskType; // Type of task: 'office' or 'field'
  location?: GeoJSONPoint; // GeoJSON Point for field tasks
}