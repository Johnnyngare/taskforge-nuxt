// server/db/models/task.ts
import { Schema, model, Document } from 'mongoose';
import { TaskStatus, TaskPriority } from '~/types/task';
import type { ITask } from '~/types/task';
import mongoose from 'mongoose';

export interface ITaskModel extends Document, Omit<ITask, 'id' | 'project'> { // Omit 'project' as it's a virtual/populated field
  userId: mongoose.Types.ObjectId; // Owner of the task
  assignedTo?: mongoose.Types.ObjectId[]; // User(s) task is assigned to
  projectId?: mongoose.Types.ObjectId; // PROJECT ID is now an ObjectId for ref
  cost?: number; // Added cost field
}

const taskSchema = new Schema<ITaskModel>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.Pending, required: true },
    priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.Medium, required: true },
    dueDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    projectId: { type: mongoose.Types.ObjectId, ref: 'Project', index: true }, // Changed back to ObjectId with ref
    cost: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: Record<string, any>): ITask => {
        ret.id = ret._id ? String(ret._id) : ret.id;
        delete ret._id;

        if (ret.userId && mongoose.Types.ObjectId.isValid(ret.userId)) ret.userId = String(ret.userId);
        if (ret.assignedTo && Array.isArray(ret.assignedTo)) ret.assignedTo = ret.assignedTo.map((id: any) => String(id));
        
        if (ret.projectId) {
          if (typeof ret.projectId === 'object' && (ret.projectId as any).name) {
              ret.project = {
                  id: String((ret.projectId as any)._id),
                  name: (ret.projectId as any).name,
              };
              ret.projectId = ret.project.id;
          } else if (mongoose.Types.ObjectId.isValid(ret.projectId)) {
              ret.projectId = String(ret.projectId);
              ret.project = undefined;
          } else {
              ret.projectId = undefined;
              ret.project = undefined;
          }
        } else {
            ret.projectId = undefined;
            ret.project = undefined;
        }

        delete ret.__v;
        return ret as ITask;
      },
    },
    id: true,
  }
);

export const TaskModel = model<ITaskModel>('Task', taskSchema);