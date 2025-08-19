// server/db/models/task.ts
import { Schema, model, Document } from 'mongoose';
import { TaskStatus, TaskPriority, TaskType } from '~/types/task'; // Import TaskType
import type { ITask, GeoJSONPoint } from '~/types/task'; // Import GeoJSONPoint
import mongoose from 'mongoose';

export interface ITaskModel extends Document, Omit<ITask, 'id' | 'project' | 'location'> { // Omit 'project' and 'location' here for specific Mongoose types
  userId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId[];
  projectId?: mongoose.Types.ObjectId;
  cost?: number;
  // NEW MAPPING FIELDS:
  taskType: TaskType; // Stored as String, validated by enum
  location?: GeoJSONPoint; // Stored as a GeoJSON object (Mongoose type: Object)
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
    projectId: { type: mongoose.Types.ObjectId, ref: 'Project', index: true },
    cost: { type: Number, default: 0 },

    // NEW MAPPING FIELDS:
    taskType: { type: String, enum: Object.values(TaskType), default: TaskType.Office, required: true }, // Default to 'office'
    location: { // GeoJSON Schema for a Point
      type: {
        type: String, // Type field for GeoJSON (e.g., "Point")
        enum: ['Point', 'Polygon'], // Allow Point or Polygon
        required: false, // Not required as office tasks won't have it
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for Point, or nested arrays for Polygon
        required: false,
      },
      // You can add more properties here for GeoJSON objects like 'properties' if needed
    },
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

        // NEW: Ensure location is part of the returned ITask and matches GeoJSONPoint interface
        // If location.type or location.coordinates are missing, set location to undefined
        if (ret.location && ret.location.type && Array.isArray(ret.location.coordinates) && ret.location.coordinates.length >= 2) {
          ret.location = {
            type: ret.location.type,
            coordinates: ret.location.coordinates
          };
        } else {
          ret.location = undefined; // Ensure it's undefined if invalid or not present
        }

        delete ret.__v;
        return ret as ITask;
      },
    },
    id: true,
  }
);

// Create a 2dsphere index for geospatial queries (important for Leaflet/mapping)
taskSchema.index({ location: '2dsphere' }, { sparse: true }); // `sparse: true` ensures only documents with a location field are indexed

export const TaskModel = model<ITaskModel>('Task', taskSchema);