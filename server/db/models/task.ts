// server/db/models/task.ts
import { Schema, model, Document, Types } from "mongoose";

// Define Priority Enum
export enum TaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

// Define Status Enum
export enum TaskStatus {
  Pending = "pending",
  Completed = "completed",
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus; // Use the enum
  priority: TaskPriority; // Ensure priority is always present
  dueDate?: Date;
  projectId?: Types.ObjectId;
  // ... other fields (notes, checklist, etc.)
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.Pending,
    }, // Use enum and default
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.Medium,
    }, // <--- CRITICAL FIX: Add default priority
    dueDate: { type: Date },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: false },
  },
  { timestamps: true }
);

export const TaskModel = model<ITask>("Task", taskSchema);
