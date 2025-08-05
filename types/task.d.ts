// types/task.d.ts
export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "completed"; // Match backend enum exactly
  priority: "Low" | "Medium" | "High"; // Match backend enum exactly (capitalized)
  dueDate?: string; // ISO date string
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}
