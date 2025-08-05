// server/api/tasks/[id].patch.ts
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id;
  const body = await readBody(event);

  // 1. Validate the Task ID from the URL parameters
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({
      statusCode: 400,
      message: "Invalid Task ID provided.",
    });
  }

  // 2. Prepare updates, handling the projectId conversion
  const updates: any = { ...body };
  if (updates.projectId) {
    if (!mongoose.Types.ObjectId.isValid(updates.projectId)) {
      throw createError({
        statusCode: 400,
        message: "Invalid Project ID format in request body.",
      });
    }
    updates.projectId = new mongoose.Types.ObjectId(updates.projectId);
  } else if (updates.projectId === null) {
    // Allow un-assigning a task from a project
    updates.projectId = undefined;
  }

  try {
    // 3. Find and update the task in the database
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updates, {
      new: true, // Return the updated document
    });

    if (!updatedTask) {
      throw createError({
        statusCode: 404,
        message: "Task not found.",
      });
    }

    return updatedTask;
  } catch (error: any) {
    // Re-throw H3 errors
    if (error.statusCode) {
      throw error;
    }
    console.error("Error updating task:", error);
    throw createError({
      statusCode: 500,
      message: "An unexpected error occurred while updating the task.",
    });
  }
});
