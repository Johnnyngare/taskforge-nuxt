// server/api/tasks/[id].patch.ts
import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, readBody, createError } from '#imports';
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import { UserRole } from "~/types/user";
import type { ITask } from "~/types/task";

const taskUpdateSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty.").optional(),
    description: z.string().optional().or(z.literal("")),
    status: z
      .enum(["pending", "in_progress", "completed", "cancelled"])
      .optional(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
    dueDate: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
    projectId: z.string().optional().nullable(), // projectId comes as string
    assignedTo: z.array(z.string()).optional(),
    cost: z.number().min(0, "Cost cannot be negative.").optional().nullable(), // Added cost to schema
  })
  .strict();

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

  // CRITICAL RBAC for UPDATE
  let canUpdate = false;
  if (role === UserRole.Admin) { canUpdate = true; }
  else if (String(taskToUpdate.userId) === String(userId)) { canUpdate = true; }
  else if (taskToUpdate.projectId) {
    // If task is part of a project, check project-based permissions
    const project = await ProjectModel.findById(taskToUpdate.projectId).select('owner members').lean(); // projectId is ObjectId
    if (project) {
      if (String(project.owner) === String(userId) && (role === "manager" || role === "dispatcher")) { canUpdate = true; }
      else if (project.members.map(String).includes(String(userId)) && (role === "manager" || role === "dispatcher")) { canUpdate = true; }
      else if (role === UserRole.TeamManager) {
        const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
        const managedProjectIds = managerDoc?.managedProjects?.map((id: string) => String(new mongoose.Types.ObjectId(id))) || [];
        if (managedProjectIds.includes(String(taskToUpdate.projectId))) { canUpdate = true; } // projectId is ObjectId for check
      }
    }
  }

  if (!canUpdate) {
    console.warn(`Attempted unauthorized task update: User ${userId} (Role: ${role}) tried to update Task ${taskId} owned by ${taskToUpdate.userId}.`);
    throw createError({ statusCode: 403, message: "Forbidden: You do not have permission to update this task." });
  }

  const validation = taskUpdateSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid update data.",
      data: validation.error.format(),
    });
  }

  const updates = validation.data;

  // Handle null/empty string values for optional fields
  if (updates.description === "") updates.description = null;
  if (updates.dueDate === "") updates.dueDate = null;
  if (updates.projectId === "") updates.projectId = null;
  if (updates.cost === "") updates.cost = null;

  const updatePayload: Record<string, any> = { ...updates };
  // Convert projectId to ObjectId if present and not null
  if (updates.projectId && typeof updates.projectId === 'string') {
    if (!mongoose.Types.ObjectId.isValid(updates.projectId)) throw createError({ statusCode: 400, message: "Invalid Project ID format for update." });
    updatePayload.projectId = new mongoose.Types.ObjectId(updates.projectId); // Convert to ObjectId
  } else if (updates.projectId === null) {
    updatePayload.projectId = null;
  }
  
  if (updates.assignedTo) {
    if (!Array.isArray(updates.assignedTo)) throw createError({ statusCode: 400, message: "Invalid assignedTo format. Must be an array of user IDs." });
    updatePayload.assignedTo = updates.assignedTo.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) throw createError({ statusCode: 400, message: `Invalid assignedTo user ID format: ${id}` });
      return new mongoose.Types.ObjectId(id);
    });
  } else if (updates.assignedTo === null || updates.assignedTo === undefined) {
    updatePayload.assignedTo = [];
  }

  // Convert cost to number if it's not null and originally a string from form input type=number
  if (typeof updates.cost === 'string' && !isNaN(parseFloat(updates.cost))) {
      updatePayload.cost = parseFloat(updates.cost);
  } else if (updates.cost === null) {
      updatePayload.cost = null;
  }


  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      throw createError({ statusCode: 404, message: "Task not found" });
    }

    const responseTask: ITask = updatedTask.toJSON();
    return { statusCode: 200, message: "Task updated successfully", task: responseTask };
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    console.error("Error updating task in DB:", error);
    throw createError({ statusCode: 500, message: "An error occurred while updating the task." });
  }
});