// server/api/tasks/[id].patch.ts

import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, readBody, createError } from "h3";
import { UserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";
import type { ITask } from "~/types/task"; // FIX: Import ITask for consistent return type

const taskUpdateSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty.").optional(),
    description: z.string().optional().or(z.literal("")),
    status: z
      .enum(["pending", "in_progress", "completed", "cancelled"])
      .optional(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
    dueDate: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
    projectId: z.string().optional(),
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

  let canUpdate = false;
  if (role === UserRole.Admin) {
    canUpdate = true;
  } else if (String(taskToUpdate.userId) === String(userId)) {
    canUpdate = true;
  } else if (role === UserRole.TeamManager) {
    if (taskToUpdate.projectId) {
      const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
      const managedProjectIds = managerDoc?.managedProjects?.map((id: string) => String(new mongoose.Types.ObjectId(id))) || [];
      if (managedProjectIds.includes(String(taskToUpdate.projectId))) {
        canUpdate = true;
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

  if (updates.description === "") {
    updates.description = null; // Set to null if it should be unset in DB
  }
  if (updates.dueDate === "") {
    updates.dueDate = null; // Set to null if it should be unset in DB
  }

  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updates, {
      new: true, // Return the updated document
      runValidators: true,
    });

    if (!updatedTask) {
      throw createError({ statusCode: 404, message: "Task not found" });
    }

    // FIX: Explicitly convert to plain object with 'id' for the response
    const responseTask: ITask = updatedTask.toJSON(); // toJSON() handles _id to id mapping and other transforms
    return responseTask;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error updating task in DB:", error);
    throw createError({
      statusCode: 500,
      message: "An error occurred while updating the task.",
    });
  }
});