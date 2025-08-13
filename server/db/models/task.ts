// server/db/models/task.ts
import { Schema, model, Document } from 'mongoose';
import { TaskStatus, TaskPriority, type ITask } from '~/types/task'; // Import ITask and enums

export interface ITaskModel extends Document, Omit<ITask, 'id'> { // Omit 'id' here as it's a virtual
  userId: mongoose.Types.ObjectId; // Owner of the task
  assignedTo?: mongoose.Types.ObjectId; // User task is assigned to
  // Assuming projectId is also ObjectId
  projectId?: mongoose.Types.ObjectId;
}

const taskSchema = new Schema<ITaskModel>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.Pending, required: true },
    priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.Medium, required: true },
    dueDate: { type: Date },
    // Link task to its creator/owner
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Optional: link task to an assignee if different from owner
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    // Optional: link task to a project
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      virtuals: true, // Ensure virtuals are included
      transform: (doc, ret: Record<string, any>): ITask => {
        // Transform _id to id (string)
        ret.id = ret._id ? String(ret._id) : ret.id;
        delete ret._id; // Remove _id

        // Ensure projectId and userId are also strings if they are ObjectIds
        if (ret.projectId && typeof ret.projectId === 'object') {
          ret.projectId = String(ret.projectId);
        }
        if (ret.userId && typeof ret.userId === 'object') {
          ret.userId = String(ret.userId);
        }
        if (ret.assignedTo && typeof ret.assignedTo === 'object') {
          ret.assignedTo = String(ret.assignedTo);
        }

        delete ret.__v; // Remove Mongoose version key
        return ret as ITask; // Cast to ITask for type safety
      },
    },
    id: true, // Tells Mongoose to create an 'id' virtual getter by default
  }
);

// Add indexes for common queries
taskSchema.index({ userId: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });

export const TaskModel = model<ITaskModel>('Task', taskSchema);