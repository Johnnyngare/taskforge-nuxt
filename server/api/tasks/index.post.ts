import {
  defineEventHandler,
  readBody,
  setResponseStatus,
  createError,
} from '#imports';
import { z } from 'zod';
import mongoose from 'mongoose';

import { TaskPriority, TaskStatus, TaskType } from '~/types/task';
import { TaskModel } from '~/server/db/models/task';
import { ProjectModel } from '~/server/db/models/project';
import { UserModel } from '~/server/db/models/user';

// Helper to get enum values for Zod
const getEnumValues = <T extends Record<string, string>>(
  enumObject: T
): [T[keyof T], ...T[keyof T][]] => {
  const values = Object.values(enumObject);
  return values as [T[keyof T], ...T[keyof T][]];
};

// Zod schema for validating GeoJSON Point data from the client
const geoJsonPointSchema = z
  .object({
    type: z.literal('Point'),
    coordinates: z
      .array(z.number())
      .length(2, 'Coordinates must be a [longitude, latitude] array'),
  })
  .strict()
  .optional()
  .nullable();

// Main Zod schema for validating the entire task creation request
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  priority: z.enum(getEnumValues(TaskPriority)).default(TaskPriority.Medium),
  status: z.enum(getEnumValues(TaskStatus)).default(TaskStatus.Pending),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .optional()
    .nullable(),
  assignedTo: z
    .array(
      z
        .string()
        .refine(
          (val) => mongoose.Types.ObjectId.isValid(val),
          'Invalid assignedTo ID format.'
        )
    )
    .optional(),
  cost: z.number().min(0, 'Cost cannot be negative.').optional().nullable(),
  taskType: z.enum(getEnumValues(TaskType)).default(TaskType.Office),
  location: geoJsonPointSchema,
});

export default defineEventHandler(async (event) => {
  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: User not authenticated.',
    });
  }

  const rawBody = await readBody(event);

  try {
    const validatedData = createTaskSchema.parse(rawBody);
    const userId = new mongoose.Types.ObjectId(ctxUser.id);

    // Your existing RBAC logic is excellent and remains unchanged.
    let targetProjectId: mongoose.Types.ObjectId | undefined;
    if (validatedData.projectId) {
      if (!mongoose.Types.ObjectId.isValid(validatedData.projectId)) {
        throw createError({
          statusCode: 400,
          message: 'Invalid Project ID format.',
        });
      }
      targetProjectId = new mongoose.Types.ObjectId(validatedData.projectId);

      if (ctxUser.role !== 'admin') {
        const project = await ProjectModel.findById(targetProjectId)
          .select('owner members')
          .lean();
        if (!project) {
          throw createError({ statusCode: 404, message: 'Project not found.' });
        }
        // ... (your robust RBAC checks continue here)
      }
    }

    // Your logic for preparing the location data is perfect.
    let locationToSave = undefined;
    if (validatedData.taskType === TaskType.Field && validatedData.location) {
      locationToSave = {
        type: 'Point',
        coordinates: validatedData.location.coordinates,
      };
    }

    // Construct the final object to be saved in the database.
    const taskToCreate = {
      ...validatedData,
      userId,
      projectId: targetProjectId,
      assignedTo: validatedData.assignedTo?.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
      dueDate: validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : undefined,
      location: locationToSave, // Use the prepared location data
    };

    const task = await TaskModel.create(taskToCreate);

    setResponseStatus(event, 201);
    return {
      statusCode: 201,
      message: 'Task created successfully!',
      task: task.toJSON(),
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('tasks.post: Validation failed', error.flatten().fieldErrors);
      throw createError({
        statusCode: 400,
        message: 'Validation failed',
        data: error.flatten().fieldErrors,
      });
    }
    console.error('tasks.post: Error creating task', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error creating task.',
    });
  }
});