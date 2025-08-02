// server/db/models/task.ts
import { Schema, model, Document, Types } from 'mongoose'; // Import Document and Types

export interface ITask extends Document { // Extend Document for Mongoose methods
  title: string;
  description?: string;
  status: 'pending' | 'completed'; // Added status enum
  dueDate?: Date;
  projectId?: Types.ObjectId; // Make it optional by adding '?' and removing required: true
  // Add other fields you may have or plan to add based on your schema
  // For example, if you have user roles, you might need them here too.
  // assignedTo?: Types.ObjectId[];
  // notes?: string;
  // checklist?: { text: string; completed: boolean; _id?: Types.ObjectId }[];
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' }, // Ensure enum is defined or included
  dueDate: { type: Date },
  // projectId is now optional
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false }, // <--- CRITICAL CHANGE
}, { timestamps: true });

export const TaskModel = model<ITask>('Task', taskSchema);