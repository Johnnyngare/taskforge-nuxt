// server/db/models/project.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number; // Total budget
  costSpent?: number; // Track actual spending (can be calculated or updated)
  manager: mongoose.Types.ObjectId; // User ID of the project manager
  members: mongoose.Types.ObjectId[]; // Array of User IDs
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled';
  // You might want to calculate completion percentage based on linked tasks
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  budget: { type: Number, default: 0 },
  costSpent: { type: Number, default: 0 },
  manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Planning', 'Active', 'Completed', 'On Hold', 'Cancelled'], default: 'Active' },
}, { timestamps: true });

export const ProjectModel = mongoose.model<IProject>('Project', ProjectSchema); // Changed export to named export