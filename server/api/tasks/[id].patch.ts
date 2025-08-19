// server/api/tasks/[id].patch.ts
import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, readBody, createError } from '#imports';
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import { UserRole } from "~/types/user";
import type { ITask } from "~/types/task";
import { TaskType, TaskStatus, TaskPriority } from "~/types/task"; // Import TaskType, etc.

// NEW: Zod Schema for GeoJSON Point
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
    description: z.string().optional().or(z.literal("")).nullable(), // Allow null explicitly
    status: z.enum(getEnumValues(TaskStatus)).optional(),
    priority: z.enum(getEnumValues(TaskPriority)).optional(),
    dueDate: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")).nullable(), // Allow null explicitly
    projectId: z.string().optional().nullable(),
    assignedTo: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid assignedTo ID format.")).optional().nullable(),
    cost: z.number().min(0, "Cost cannot be negative.").optional().nullable(),

    // NEW MAPPING FIELDS:
    taskType: z.enum(getEnumValues(TaskType)).optional(), // Can update task type
    location: geoJsonPointSchema, // Can update or remove location
  })
  .strict(); // strict() ensures no extra properties are passed

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id;
  const body = await readBody(event);

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({ statusCode: 400, message: "Invalid Task ID" });
  }

  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const role = ctxUser.role;

  const taskToUpdate = await TaskModel.findById(taskId);

  if (!taskToUpdate) {
    throw createError({ statusCode: 404, message: "Task not found" });
  }

  // CRITICAL RBAC for UPDATE (unchanged from previous version, as it was correct)
  let canUpdate = false;
  if (role === UserRole.Admin) { canUpdate = true; }
  else if (String(taskToUpdate.userId) === String(userId)) { canUpdate = true; }
  else if (taskToUpdate.projectId) {
    const project = await ProjectModel.findById(taskToUpdate.projectId).select('owner members').lean();
    if (project) {
      if (String(project.owner) === String(userId) && (role === UserRole.Manager || role === UserRole.Dispatcher)) { canUpdate = true; }
      else if (project.members.map(String).includes(String(userId)) && (role === UserRole.Manager || role === UserRole.Dispatcher)) { canUpdate = true; }
      else if (role === UserRole.TeamManager) {
        const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
        const managedProjectIds = managerDoc?.managedProjects?.map((id: mongoose.Types.ObjectId) => String(id)) || [];
        if (managedProjectIds.includes(String(taskToUpdate.projectId))) { canUpdate = true; }
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
  const updatePayload: Record<string, any> = {}; // Initialize updatePayload

  // Apply updates conditionally
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description === "" ? null : updates.description; // Handle empty string to null
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.priority !== undefined) updatePayload.priority = updates.priority;
  if (updates.dueDate !== undefined) updatePayload.dueDate = updates.dueDate === "" ? null : (updates.dueDate ? new Date(updates.dueDate) : null); // Handle empty string to null or convert to Date
  if (updates.cost !== undefined) updatePayload.cost = updates.cost === "" ? null : updates.cost; // Handle empty string to null or keep number

  // Handle projectId update
  if (updates.projectId !== undefined) {
    if (updates.projectId === null || updates.projectId === "") {
      updatePayload.projectId = null;
    } else if (typeof updates.projectId === 'string' && mongoose.Types.ObjectId.isValid(updates.projectId)) {
      updatePayload.projectId = new mongoose.Types.ObjectId(updates.projectId);
    } else {
      throw createError({ statusCode: 400, message: "Invalid Project ID format for update." });
    }
  }

  // Handle assignedTo update
  if (updates.assignedTo !== undefined) {
    if (updates.assignedTo === null || updates.assignedTo.length === 0) {
      updatePayload.assignedTo = [];
    } else if (Array.isArray(updates.assignedTo)) {
      updatePayload.assignedTo = updates.assignedTo.map(id => new mongoose.Types.ObjectId(id));
    } else {
      throw createError({ statusCode: 400, message: "Invalid assignedTo format. Must be an array of user IDs." });
    }
  }

  // NEW MAPPING FIELDS LOGIC:
  if (updates.taskType !== undefined) {
      updatePayload.taskType = updates.taskType;
  }

  // If taskType is changed to Office, ensure location is removed/nullified
  // OR if a location is explicitly passed, process it
  if (updates.location !== undefined) { // If location is part of the update payload
      if (updates.taskType === TaskType.Office || updates.location === null) {
          updatePayload.location = null; // Set location to null if office task or explicitly null
      } else if (updates.taskType === TaskType.Field && updates.location) {
          if (updates.location.type === "Point" && updates.location.coordinates?.length === 2) {
              updatePayload.location = {
                  type: "Point",
                  coordinates: [updates.location.coordinates[0], updates.location.coordinates[1]]
              };
          } else {
              throw createError({ statusCode: 400, message: "Invalid location data for Field task." });
          }
      } else if (updates.taskType === undefined && updates.location) {
          // If taskType is not being updated, but location is provided,
          // ensure the current taskType is 'Field' if location is being set.
          // Or allow setting location if it's already a field task.
          if (taskToUpdate.taskType === TaskType.Field) {
               if (updates.location.type === "Point" && updates.location.coordinates?.length === 2) {
                   updatePayload.location = {
                       type: "Point",
                       coordinates: [updates.location.coordinates[0], updates.location.coordinates[1]]
                   };
               } else {
                   throw createError({ statusCode: 400, message: "Invalid location data for Field task (existing)." });
               }
          } else {
              // If current task is Office type and location is attempted to be set without changing taskType, disallow.
              throw createError({ statusCode: 400, message: "Cannot set location on an Office task without changing task type to Field." });
          }
      }
  } else if (updates.taskType === TaskType.Office) {
      // If taskType is explicitly set to Office and location was NOT in the update payload,
      // explicitly clear location from DB.
      updatePayload.location = null;
  }


  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      throw createError({ statusCode: 404, message: "Task not found" });
    }

    const responseTask: ITask = updatedTask.toJSON(); // Apply Mongoose transform
    return { statusCode: 200, message: "Task updated successfully", task: responseTask };
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    console.error("Error updating task in DB:", error);
    throw createError({ statusCode: 500, message: "An error occurred while updating the task." });
  }
});