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
  budget: { type: Number, default: 0 }, // Ensure default value to handle null/undefined if needed
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
      // Ensure owner and members are consistently stringified
      if (ret.owner && typeof ret.owner === 'object' && ret.owner._id) { // Check if populated object
        ret.owner = ret.owner._id.toString();
      } else if (ret.owner && typeof ret.owner !== 'string') { // Check if unpopulated ObjectId
        ret.owner = ret.owner.toString();
      }

      if (ret.members && Array.isArray(ret.members)) {
        ret.members = ret.members.map((member: any) =>
          typeof member === 'object' && member._id ? member._id.toString() : String(member)
        );
      }
      return ret as IProject;
    },
  },
  id: true,
});

export const ProjectModel = model('Project', projectSchema);