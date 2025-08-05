// server/api/tasks/[id].patch.ts

import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, readBody, createError } from "h3";

// Zod schema for validating the incoming update payload
const taskUpdateSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty.").optional(),
    description: z.string().optional(),
    status: z
      .enum(["pending", "in_progress", "completed", "cancelled"])
      .optional(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
    dueDate: z.string().datetime().optional().or(z.literal("")), // Allow empty string to unset date
    projectId: z.string().optional(),
  })
  .strict(); // Disallow any extra fields

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id;
  const body = await readBody(event);

  // 1. Validate Task ID
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({ statusCode: 400, message: "Invalid Task ID" });
  }

  // 2. Validate request body
  const validation = taskUpdateSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid update data.",
      data: validation.error.errors,
    });
  }

  const updates = validation.data;

  // Handle unsetting optional fields
  if (updates.description === "") {
    updates.description = undefined;
  }
  if (updates.dueDate === "") {
    updates.dueDate = undefined;
  }

  try {
    // 3. Find and update the task
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updates, {
      new: true, // Return the updated document
      runValidators: true, // Run Mongoose schema validators
    });

    if (!updatedTask) {
      throw createError({ statusCode: 404, message: "Task not found" });
    }

    return updatedTask;
  } catch (error: any) {
    console.error("Error updating task:", error);
    throw createError({
      statusCode: 500,
      message: "An error occurred while updating the task.",
    });
  }
});
