// server/api/tasks/[id].patch.ts
import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import { UserRole } from "~/types/user";
import type { ITask } from "~/types/task";
import { TaskType, TaskStatus, TaskPriority } from "~/types/task";
import type { H3Event } from 'h3';

// Zod Schema for GeoJSON Point
const geoJsonPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.array(z.number()).length(2, "Coordinates must be a [longitude, latitude] array"),
}).strict().optional().nullable();

const getEnumValues = <T extends Record<string, string>>(
  enumObject: T
): [T[keyof T], ...T[keyof T][]] => {
  const values = Object.values(enumObject);
  return values as [T[keyof T], ...T[keyof T][]];
};

const taskUpdateSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty.").optional(),
    description: z.string().optional().or(z.literal("")).nullable(),
    status: z.enum(getEnumValues(TaskStatus)).optional(),
    priority: z.enum(getEnumValues(TaskPriority)).optional(),
    dueDate: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")).nullable(),
    projectId: z.string().optional().nullable(),
    assignedTo: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid assignedTo ID format.")).optional().nullable(),
    cost: z.number().min(0, "Cost cannot be negative.").optional().nullable(),
    taskType: z.enum(getEnumValues(TaskType)).optional(),
    location: geoJsonPointSchema,
  })
  .strict();

export default defineEventHandler(async (event: H3Event) => {
  const taskId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({ statusCode: 400, message: "Invalid Task ID" });
  }

  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const role: UserRole = ctxUser.role as UserRole;

  const taskToUpdate = await TaskModel.findById(taskId);

  if (!taskToUpdate) {
    throw createError({ statusCode: 404, message: "Task not found" });
  }

  // --- REVISED RBAC for UPDATE (Comprehensive & Handles 'dispatcher' properly) ---
  let canUpdate = false;
  if (role === UserRole.Admin) {
    canUpdate = true;
  } else if (taskToUpdate.userId.equals(userId)) { // Task owner
    canUpdate = true;
  } else if (taskToUpdate.assignedTo?.some(assignedId => assignedId.equals(userId))) { // Task assigned to user
    canUpdate = true;
  } else if ([UserRole.Manager, UserRole.Dispatcher].includes(role)) {
    // Managers/Dispatchers can update tasks within projects they manage or are part of
    if (taskToUpdate.projectId) {
      const project = await ProjectModel.findById(taskToUpdate.projectId).select('owner members').lean();
      if (project) {
        // If manager/dispatcher is project owner or member (direct project involvement)
        if (project.owner.equals(userId) || project.members?.some(memberId => memberId.equals(userId))) {
          canUpdate = true;
        } else {
          // Check if manager/dispatcher explicitly manages this project via their 'managedProjects' list
          const managerUser = await UserModel.findById(userId).select('managedProjects').lean();
          if (managerUser?.managedProjects?.some((mpId: mongoose.Types.ObjectId) => mpId.equals(taskToUpdate.projectId))) {
            canUpdate = true;
          }
        }
      }
    }
  }

  if (!canUpdate) {
    console.warn(`Attempted unauthorized task update: User ${userId} (Role: ${role}) tried to update Task ${taskId} owned by ${taskToUpdate.userId}.`);
    throw createError({ statusCode: 403, message: "Forbidden: You do not have permission to update this task." });
  }

  const validation = taskUpdateSchema.safeParse(body);
  if (!validation.success) {
    console.error("Task update validation failed:", validation.error.format());
    throw createError({
      statusCode: 400,
      message: "Invalid update data.",
      data: validation.error.format(),
    });
  }

  const updates = validation.data;
  const updatePayload: Record<string, any> = {};

  // Build updatePayload carefully, handling `null`, `undefined`, and empty strings
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description === "" ? null : updates.description;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.priority !== undefined) updatePayload.priority = updates.priority;
  if (updates.dueDate !== undefined) updatePayload.dueDate = updates.dueDate === "" ? null : (updates.dueDate ? new Date(updates.dueDate) : null);
  if (updates.cost !== undefined) updatePayload.cost = (updates.cost === null || updates.cost === "") ? null : updates.cost;
  
  if (updates.projectId !== undefined) {
    if (updates.projectId === null || updates.projectId === "") {
      updatePayload.projectId = null;
    } else if (typeof updates.projectId === 'string' && mongoose.Types.ObjectId.isValid(updates.projectId)) {
      updatePayload.projectId = new mongoose.Types.ObjectId(updates.projectId);
    } else {
      throw createError({ statusCode: 400, message: "Invalid Project ID format for update." });
    }
  }

  if (updates.assignedTo !== undefined) {
    if (updates.assignedTo === null || (Array.isArray(updates.assignedTo) && updates.assignedTo.length === 0)) {
      updatePayload.assignedTo = [];
    } else if (Array.isArray(updates.assignedTo)) {
      updatePayload.assignedTo = updates.assignedTo.map(id => new mongoose.Types.ObjectId(id));
    } else {
      throw createError({ statusCode: 400, message: "Invalid assignedTo format. Must be an array of user IDs." });
    }
  }

  // --- TaskType and Location Update Logic ---
  if (updates.taskType !== undefined) {
      updatePayload.taskType = updates.taskType;
  }

  if (updates.location !== undefined) {
      if (updatePayload.taskType === TaskType.Office || updates.location === null) {
          updatePayload.location = null;
      } else if (updatePayload.taskType === TaskType.Field && updates.location) {
          if (updates.location.type === "Point" && updates.location.coordinates?.length === 2) {
              updatePayload.location = {
                  type: "Point",
                  coordinates: [updates.location.coordinates[0], updates.location.coordinates[1]]
              };
          } else {
              throw createError({ statusCode: 400, message: "Invalid location data for Field task." });
          }
      } else if (updates.taskType === undefined && updates.location) {
          if (taskToUpdate.taskType === TaskType.Field) {
               if (updates.location.type === "Point" && updates.location.coordinates?.length === 2) {
                   updatePayload.location = {
                       type: "Point",
                       coordinates: [updates.location.coordinates[0], updates.location.coordinates[1]]
                   };
               } else {
                   throw createError({ statusCode: 400, message: "Invalid location data for Field task (existing type)." });
               }
          } else {
              throw createError({ statusCode: 400, message: "Cannot set location on an Office task without explicitly changing task type to Field." });
          }
      }
  } else if (updatePayload.taskType === TaskType.Office) {
      updatePayload.location = null;
  }

  // Remove `undefined` values from payload before sending to Mongoose to avoid unintended updates.
  Object.keys(updatePayload).forEach(key => {
    if (updatePayload[key] === undefined) {
      delete updatePayload[key];
    }
  });

  try {
    const updatedTaskDoc = await TaskModel.findByIdAndUpdate(taskId, updatePayload, {
      new: true,
      runValidators: true,
    }).populate('projectId', 'name').lean();

    if (!updatedTaskDoc) {
      throw createError({ statusCode: 404, message: "Task not found after update attempt" });
    }

    const responseTask: ITask = new TaskModel(updatedTaskDoc).toJSON();
    return responseTask;
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: "Server-side validation failed during task update.",
        data: error.format(),
      });
    }
    if (error.name === 'ValidationError') {
      throw createError({
        statusCode: 400,
        message: error.message,
        data: error.errors,
      });
    }
    throw createError({ statusCode: 500, message: "An unexpected error occurred while updating the task.", cause: error });
  }
});