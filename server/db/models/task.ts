// server/db/models/task.ts
import { Schema, model, Document, Types } from "mongoose";
import { TaskPriority, TaskStatus } from "~/types/task"; // Removed unused ITask import

export interface IMongooseTask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId?: Types.ObjectId;
  userId: Types.ObjectId; // ✅ Added creator/assignee reference
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

const taskSchema = new Schema<IMongooseTask>(
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
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // ✅ Ensure every task has a creator/assignee
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: Record<string, any>) {
        ret.id = ret._id.toString(); // ✅ Add a clean `id` field
        delete ret._id;
        delete ret.__v;
        if (ret.projectId && ret.projectId instanceof Types.ObjectId) {
          ret.projectId = ret.projectId.toString();
        }
        if (ret.userId && ret.userId instanceof Types.ObjectId) {
          ret.userId = ret.userId.toString();
        }
        return ret;
      },
    },
    id: true,
  }
);

// Indexes for performance
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ userId: 1 }); // ✅ Filter tasks by user quickly

export const TaskModel = model<IMongooseTask>("Task", taskSchema);
