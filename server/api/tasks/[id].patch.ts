// server/api/tasks/[id].patch.ts - UPDATED
import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import { UserRole } from "~/types/user";
import type { ITask } from "~/types/task";
import { TaskType, TaskStatus, TaskPriority } from "~/types/task";
import type { H3Event } from 'h3';
import { sendEmail, getTaskAssignmentEmailHtml } from '~/server/utils/emailService'; // NEW import for email service

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
    projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid Project ID format.').optional().nullable(),
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
    console.error("tasks.patch: Server-side validation failed:", validation.error.format());
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

  let oldAssignedToIds = taskToUpdate.assignedTo ? taskToUpdate.assignedTo.map(id => String(id)) : [];
  let newAssignedToIds: string[] = [];

  if (updates.assignedTo !== undefined) { // If assignedTo is explicitly sent in the update payload
    if (updates.assignedTo === null || (Array.isArray(updates.assignedTo) && updates.assignedTo.length === 0)) {
      updatePayload.assignedTo = [];
      newAssignedToIds = []; // No new assignments
    } else if (Array.isArray(updates.assignedTo)) {
      // Validate assigned users are Field Officers
      const assignedUsers = await UserModel.find({ _id: { $in: updates.assignedTo } });
      const invalidAssignedUsers = assignedUsers.filter(u => u.role !== UserRole.FieldOfficer);
      if (invalidAssignedUsers.length > 0) {
          throw createError({ statusCode: 400, message: `Cannot assign task to non-Field Officer users: ${invalidAssignedUsers.map(u => u.email).join(', ')}.` });
      }
      updatePayload.assignedTo = assignedUsers.map(u => u._id);
      newAssignedToIds = assignedUsers.map(u => String(u._id));
    } else {
      throw createError({ statusCode: 400, message: "Invalid assignedTo format. Must be an array of user IDs." });
    }
  } else {
    // If assignedTo is not in the updates payload, newAssignedToIds should reflect current DB state
    newAssignedToIds = oldAssignedToIds;
  }

  // --- TaskType and Location Update Logic ---
  // Existing logic for taskType and location looks reasonable
  if (updates.taskType !== undefined) {
      updatePayload.taskType = updates.taskType;
  }

  if (updates.location !== undefined) {
      if (updatePayload.taskType === TaskType.Office || updates.location === null) {
          updatePayload.location = null;
      } else if ((updatePayload.taskType === TaskType.Field || taskToUpdate.taskType === TaskType.Field) && updates.location) { // Check both current or updated type
          if (updates.location.type === "Point" && updates.location.coordinates?.length === 2) {
              updatePayload.location = {
                  type: "Point",
                  coordinates: [updates.location.coordinates[0], updates.location.coordinates[1]]
              };
          } else {
              throw createError({ statusCode: 400, message: "Invalid location data for Field task." });
          }
      } else { // Attempt to set location on an Office task without changing type
          throw createError({ statusCode: 400, message: "Cannot set location on an Office task without explicitly changing task type to Field." });
      }
  } else if (updatePayload.taskType === TaskType.Office) { // If taskType becomes Office and no new location is provided, clear existing
      updatePayload.location = null;
  } else if (updatePayload.taskType === undefined && updates.location === undefined) {
      // If taskType isn't changing and location isn't specified, keep existing location
      // No action needed here, it will default to taskToUpdate.location
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
    }).populate('projectId', 'name')
      .populate('userId', 'name email profilePhoto') // Populate author
      .populate('assignedTo', 'name email profilePhoto role') // Populate for email & response
      .lean();

    if (!updatedTaskDoc) {
      throw createError({ statusCode: 404, message: "Task not found after update attempt" });
    }

    // NEW: Send email notification if assignedTo changed
    const assignedUserEmailsToSend: { name: string; email: string }[] = [];
    const config = useRuntimeConfig();
    const dashboardUrl = `${config.public.baseUrlPublic}/dashboard`;

    // Determine who was newly assigned or unassigned
    const newlyAssigned = newAssignedToIds.filter(id => !oldAssignedToIds.includes(id));
    const unassigned = oldAssignedToIds.filter(id => !newAssignedToIds.includes(id));

    if (newlyAssigned.length > 0) {
        const newlyAssignedUsers = await UserModel.find({ _id: { $in: newlyAssigned } }).select('name email').lean();
        await Promise.all(newlyAssignedUsers.map(async (assignedUser) => {
            if (assignedUser.email) {
                const emailHtml = getTaskAssignmentEmailHtml(
                    assignedUser.name || assignedUser.email,
                    updatedTaskDoc.title,
                    dashboardUrl,
                    ctxUser.name || ctxUser.email
                );
                try {
                    await sendEmail({
                        to: assignedUser.email,
                        subject: `Taskforge: You've been assigned a task: "${updatedTaskDoc.title}"`,
                        html: emailHtml,
                        text: `Hello ${assignedUser.name || assignedUser.email},\nYou have been assigned a new task: "${updatedTaskDoc.title}" by ${ctxUser.name || ctxUser.email}.\nPlease log in to your Taskforge dashboard to view the details: ${dashboardUrl}`
                    });
                } catch (emailError) {
                    console.error(`[API PATCH /tasks] Failed to send assignment email to ${assignedUser.email}:`, emailError);
                }
            }
        }));
    }

    // Optionally, send notification to unassigned users (e.g., "Task removed from you")
    if (unassigned.length > 0) {
        // Implementation for unassigned notifications
        console.log(`[API PATCH /tasks] Users unassigned: ${unassigned.join(', ')} from task: ${updatedTaskDoc.title}`);
    }

    const responseTask: ITask = new TaskModel(updatedTaskDoc).toJSON();
    return responseTask;
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    if (error instanceof z.ZodError) {
      console.error("tasks.patch: Server-side validation failed:", error.format());
      throw createError({
        statusCode: 400,
        message: "Server-side validation failed during task update.",
        data: error.format(),
      });
    }
    if (error.name === 'ValidationError') {
      console.error("tasks.patch: Mongoose validation failed:", error.message, error.errors);
      throw createError({
        statusCode: 400,
        message: error.message,
        data: error.errors,
      });
    }
    throw createError({ statusCode: 500, message: "An unexpected error occurred while updating the task.", cause: error });
  }
});