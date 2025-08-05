// server/api/tasks/[id].delete.ts
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id;

  // 1. Validate the Task ID from the URL parameters
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({
      statusCode: 400,
      message: "Invalid Task ID provided.",
    });
  }

  try {
    // 2. Find and delete the task in the database
    const deletedTask = await TaskModel.findByIdAndDelete(taskId);

    if (!deletedTask) {
      throw createError({
        statusCode: 404,
        message: "Task not found.",
      });
    }

    return {
      status: "success",
      message: "Task deleted successfully.",
      taskId: taskId,
    };
  } catch (error: any) {
    // Re-throw H3 errors
    if (error.statusCode) {
      throw error;
    }
    console.error("Error deleting task:", error);
    throw createError({
      statusCode: 500,
      message: "An unexpected error occurred while deleting the task.",
    });
  }
});
