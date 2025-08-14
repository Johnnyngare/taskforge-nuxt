// server/db/models/project.ts
import { Schema, model, Document } from "mongoose";
import type { IProject } from "~/types/project";
import mongoose from 'mongoose';

export interface IProjectModel extends Document, Omit<IProject, 'id'> {
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProjectModel>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: null },
  status: { type: String, enum: ['active', 'on_hold', 'completed', 'cancelled'], default: 'active', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', required: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  budget: { type: Number },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: Record<string, any>): IProject => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      if (ret.owner && typeof ret.owner === 'object') ret.owner = String(ret.owner);
      if (ret.members && Array.isArray(ret.members)) ret.members = ret.members.map(String);
      return ret as IProject;
    },
  },
  id: true,
});

// FIX: Remove redundant index declarations. `index: true` on fields is sufficient.
// Example of what to remove if present:
// projectSchema.index({ owner: 1 });
// projectSchema.index({ members: 1 });

export const ProjectModel = model('Project', projectSchema);