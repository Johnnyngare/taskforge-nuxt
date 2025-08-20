// server/db/models/task.ts
import { Schema, model, Document, modelNames } from 'mongoose';
import { TaskStatus, TaskPriority, TaskType } from '~/types/task';
import type { ITask, GeoJSONPoint } from '~/types/task';
import mongoose from 'mongoose';

// NEW: Define a strict sub-schema for GeoJSON Point.
// This is the canonical way to ensure data integrity for geospatial fields.
const PointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: (arr: number[]) => arr.length === 2,
        message: 'Coordinates must be an array of two numbers [lng, lat].',
      },
    },
  },
  { _id: false } // Prevent Mongoose from creating an _id for the sub-document
);

export interface ITaskModel extends Document, Omit<ITask, 'id' | 'project'> {
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
}

const taskSchema = new Schema<ITaskModel>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim:true },
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
    dueDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    cost: { type: Number },

    // --- UPDATED MAPPING FIELDS ---
    taskType: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.Office,
      required: true,
    },
    // Use the new, strict PointSchema for the location field.
    location: {
      type: PointSchema,
      required: false, // Not required for Office tasks
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Your existing project population logic is good.
        if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId.name) {
          ret.project = {
            id: ret.projectId._id.toString(),
            name: ret.projectId.name,
          };
          ret.projectId = ret.project.id;
        }
      },
    },
  }
);

// Create a 2dsphere index for efficient geospatial queries.
taskSchema.index({ location: '2dsphere' }, { sparse: true });

// Prevent model overwrite error in HMR environments
export const TaskModel = mongoose.models.Task || model<ITaskModel>('Task', taskSchema);