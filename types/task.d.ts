// types/task.d.ts

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}