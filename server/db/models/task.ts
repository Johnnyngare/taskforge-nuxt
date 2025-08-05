// server/db/models/task.ts
import { Schema, model, Document, Types } from "mongoose";

// Define Priority Enum - these should match your frontend exactly
export enum TaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

// Define Status Enum - these should match your frontend exactly
export enum TaskStatus {
  Pending = "pending",
  Completed = "completed",
  inProgress = "in-progress",
  Cancelled = "cancelled",
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId?: Types.ObjectId;
  createdAt: Date; // These are Date objects in Mongoose.
  updatedAt: Date; // They'll be converted to ISO strings on toJSON if not handled.
  _id: Types.ObjectId; // Explicitly add _id for better type safety
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Task description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.Pending,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.Medium,
      required: true,
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value instanceof Date;
        },
        message: "Due date must be a valid date",
      },
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: Record<string, any>) {
        // FIX: Type 'ret' as Record<string, any>
        // Convert _id to string for frontend compatibility
        ret._id = ret._id.toString(); // This is fine now
        if (ret.projectId) {
          ret.projectId = ret.projectId.toString();
        }
        // Ensure Date objects are also converted to ISO strings if needed for consistency with frontend.
        // Mongoose's toJSON usually does this for timestamps automatically, but explicitly for others.
        if (ret.createdAt && ret.createdAt instanceof Date) {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt && ret.updatedAt instanceof Date) {
          ret.updatedAt = ret.updatedAt.toISOString();
        }
        if (ret.dueDate && ret.dueDate instanceof Date) {
          ret.dueDate = ret.dueDate.toISOString();
        }
        return ret;
      },
    },
  }
);

// Add indexes for better query performance
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

export const TaskModel = model<ITask>("Task", taskSchema);
