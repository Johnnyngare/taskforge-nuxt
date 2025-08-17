// server/db/models/task.ts
import { Schema, model, Document } from 'mongoose';
import { TaskStatus, TaskPriority } from '~/types/task';
import type { ITask } from '~/types/task';
import mongoose from 'mongoose';

export interface ITaskModel extends Document, Omit<ITask, 'id'> {
  userId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId[];
  projectId?: mongoose.Types.ObjectId;
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
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: Record<string, any>): ITask => {
        ret.id = ret._id ? String(ret._id) : ret.id;
        delete ret._id;
        if (ret.projectId && mongoose.Types.ObjectId.isValid(ret.projectId)) ret.projectId = String(ret.projectId);
        if (ret.userId && mongoose.Types.ObjectId.isValid(ret.userId)) ret.userId = String(ret.userId);
        if (ret.assignedTo && Array.isArray(ret.assignedTo)) ret.assignedTo = ret.assignedTo.map((id: any) => String(id));
        delete ret.__v;
        return ret as ITask;
      },
    },
    id: true,
  }
);

// FIX: REMOVE REDUNDANT taskSchema.index() CALLS HERE.
// The `index: true` on the field definitions is sufficient.
// The following lines were causing the duplicate index warnings:
// taskSchema.index({ userId: 1 });
// taskSchema.index({ projectId: 1 });
// taskSchema.index({ status: 1 }); // If not inline, keep. But it is inline above.
// taskSchema.index({ assignedTo: 1 });

export const TaskModel = model<ITaskModel>('Task', taskSchema);