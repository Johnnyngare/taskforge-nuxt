// server/db/models/task.ts
import { Schema, model, Document, Types } from "mongoose";
// FIX: Only import enums from the shared types file
// Change this line:
import { TaskPriority, TaskStatus, type ITask } from "~/types/task";

export interface IMongooseTask extends Document {
  title: string;
  description?: string;
  status: TaskStatus; // Uses shared enum
  priority: TaskPriority; // Uses shared enum
  dueDate?: Date; // Mongoose type
  projectId?: Types.ObjectId; // Mongoose type
  createdAt: Date; // Mongoose type
  updatedAt: Date; // Mongoose type
  _id: Types.ObjectId; // Mongoose type
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
      required: false,
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
      virtuals: true,
      transform: function (doc, ret: Record<string, any>) {
        delete ret._id;
        delete ret.__v;
        if (ret.projectId && ret.projectId instanceof Types.ObjectId) {
          ret.projectId = ret.projectId.toString();
        }
        return ret;
      },
    },
    id: true,
  }
);

taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

export const TaskModel = model<IMongooseTask>("Task", taskSchema);
