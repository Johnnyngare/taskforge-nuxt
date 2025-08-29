// server/db/models/task.ts
import mongoose, { Schema, model, Document } from 'mongoose';
import { TaskStatus, TaskPriority, TaskType } from '~/types/task';
import type { ITask, GeoJSONPoint } from '~/types/task';

// Define a strict sub-schema for GeoJSON Point.
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

export interface ITaskModel extends Document, Omit<ITask, 'id' | 'author' | 'assignedTo' | 'project'> {
  userId: mongoose.Types.ObjectId; // Original author's ID
  projectId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId[]; // Array of ObjectIds
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Creator of the task
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Assigned field officers
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    cost: { type: Number },

    taskType: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.Office,
      required: true,
    },
    location: {
      type: PointSchema,
      required: false, // Not required for Office tasks
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: Record<string, any>) => { // Use ret: Record<string, any> for easier manipulation
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        // Transform userId to author object if populated
        if (ret.userId && typeof ret.userId === 'object' && ret.userId.name) {
          ret.author = {
            id: ret.userId._id.toString(),
            name: ret.userId.name,
            email: ret.userId.email,
          };
          delete ret.userId; // Remove original userId after transformation
        } else if (ret.userId) { // If userId is just an ObjectId, convert to string
          ret.author = { id: ret.userId.toString(), name: 'Unknown', email: 'unknown' };
          delete ret.userId;
        }


        // Transform projectId
        if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId.name) {
          ret.project = {
            id: ret.projectId._id.toString(),
            name: ret.projectId.name,
          };
          // You might choose to delete ret.projectId here if the frontend only expects 'project' object
        } else if (ret.projectId) { // If it's just an ObjectId, ensure it's a string
          ret.project = ret.projectId.toString(); // Return as string ID
        }


        // NEW: Transform assignedTo array - handle populated objects or raw IDs
        if (ret.assignedTo && Array.isArray(ret.assignedTo)) {
          ret.assignedTo = ret.assignedTo.map((assignedUser: any) => {
            if (typeof assignedUser === 'object' && assignedUser.name) {
              return { id: assignedUser._id.toString(), name: assignedUser.name, email: assignedUser.email, role: assignedUser.role };
            }
            return assignedUser.toString(); // If not populated, return ID as string
          });
        } else {
          ret.assignedTo = []; // Ensure it's always an array
        }
        return ret;
      },
    },
  }
);

// Create a 2dsphere index for efficient geospatial queries.
taskSchema.index({ location: '2dsphere' }, { sparse: true });

export const TaskModel = mongoose.models.Task || model<ITaskModel>('Task', taskSchema);