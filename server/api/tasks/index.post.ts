// server/api/tasks/index.post.ts - UPDATED
import {
  defineEventHandler,
  readBody,
  setResponseStatus,
  createError,
} from 'h3'; // Changed from '#imports' as 'h3' exports them too, for consistency.
import { z } from 'zod';
import mongoose from 'mongoose';

import { TaskPriority, TaskStatus, TaskType } from '~/types/task';
import { TaskModel } from '~/server/db/models/task';
import { ProjectModel } from '~/server/db/models/project';
import { UserModel, UserRole } from '~/server/db/models/user'; // Import UserRole
import { sendEmail, getTaskAssignmentEmailHtml } from '~/server/utils/emailService'; // NEW import for email service

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
  projectId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid Project ID format.')
    .optional()
    .nullable(),
  priority: z.enum(getEnumValues(TaskPriority)).default(TaskPriority.Medium),
  status: z.enum(getEnumValues(TaskStatus)).default(TaskStatus.Pending),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .optional()
    .nullable(),
  // UPDATED: assignedTo is an array of IDs, optional, nullable (can be null or [])
  assignedTo: z
    .array(
      z
        .string()
        .refine(
          (val) => mongoose.Types.ObjectId.isValid(val),
          'Invalid assignedTo ID format.'
        )
    )
    .optional()
    .nullable(), // Allow null or undefined if no one is assigned
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

    let targetProjectId: mongoose.Types.ObjectId | undefined;
    if (validatedData.projectId) {
      if (!mongoose.Types.ObjectId.isValid(validatedData.projectId)) {
        throw createError({
          statusCode: 400,
          message: 'Invalid Project ID format.',
        });
      }
      targetProjectId = new mongoose.Types.ObjectId(validatedData.projectId);

      // RBAC for project assignment (simplified, your full RBAC would go here)
      // Check if current user has permission to assign to this project
      if (ctxUser.role !== UserRole.Admin && ctxUser.role !== UserRole.Manager && ctxUser.role !== UserRole.Dispatcher) {
        const project = await ProjectModel.findById(targetProjectId)
          .select('owner members')
          .lean();
        if (!project) {
          throw createError({ statusCode: 404, message: 'Project not found.' });
        }
        if (!(project.owner.equals(userId) || project.members?.some(memberId => memberId.equals(userId)))) {
          throw createError({ statusCode: 403, message: 'Forbidden: You do not have permission to assign tasks to this project.' });
        }
      }
    }

    // Validate assignedTo if provided
    const assignedToUserIds: mongoose.Types.ObjectId[] = [];
    if (validatedData.assignedTo && validatedData.assignedTo.length > 0) {
        const assignedUsers = await UserModel.find({ _id: { $in: validatedData.assignedTo } });
        const invalidAssignedUsers = assignedUsers.filter(u => u.role !== UserRole.FieldOfficer);
        if (invalidAssignedUsers.length > 0) {
            throw createError({ statusCode: 400, message: `Cannot assign task to non-Field Officer users: ${invalidAssignedUsers.map(u => u.email).join(', ')}.` });
        }
        assignedToUserIds.push(...assignedUsers.map(u => u._id));
    }


    // Prepare location data
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
      userId, // Author of the task is the current user
      projectId: targetProjectId,
      assignedTo: assignedToUserIds, // Use validated and typed assignedTo IDs
      dueDate: validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : undefined,
      location: locationToSave,
    };

    const task = await TaskModel.create(taskToCreate);

    // NEW: Send email notification if task is assigned
    if (task.assignedTo && task.assignedTo.length > 0) {
        const assignedUsers = await UserModel.find({ _id: { $in: task.assignedTo } }).select('name email').lean();
        const config = useRuntimeConfig();
        const dashboardUrl = `${config.public.baseUrlPublic}/dashboard`;

        await Promise.all(assignedUsers.map(async (assignedUser) => {
            if (assignedUser.email) {
                const emailHtml = getTaskAssignmentEmailHtml(
                    assignedUser.name || assignedUser.email,
                    task.title,
                    dashboardUrl,
                    ctxUser.name || ctxUser.email // The current user's name/email as assigner
                );
                try {
                    await sendEmail({
                        to: assignedUser.email,
                        subject: `Taskforge: You've been assigned a new task: "${task.title}"`,
                        html: emailHtml,
                        text: `Hello ${assignedUser.name || assignedUser.email},\nYou have been assigned a new task: "${task.title}" by ${ctxUser.name || ctxUser.email}.\nPlease log in to your Taskforge dashboard to view the details: ${dashboardUrl}`
                    });
                } catch (emailError) {
                    console.error(`[API POST /tasks] Failed to send task assignment email to ${assignedUser.email}:`, emailError);
                }
            }
        }));
    }


    setResponseStatus(event, 201);
    // Populate assignedTo and createdBy for the response
    const taskResponse = await TaskModel.findById(task._id)
                                  .populate('userId', 'name email profilePhoto') // Populate author
                                  .populate('assignedTo', 'name email profilePhoto role') // Populate assigned users
                                  .populate('projectId', 'name')
                                  .lean();
    return new TaskModel(taskResponse).toJSON();

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