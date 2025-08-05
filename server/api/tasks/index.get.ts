// server/api/tasks/index.get.ts
import { TaskModel } from "~/server/db/models/task";
import mongoose from "mongoose";
import { defineEventHandler, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filter: any = {};

  // Build the filter object based on query parameters
  if (query.status) {
    filter.status = query.status;
  }

  if (query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(query.projectId as string)) {
      throw createError({
        statusCode: 400,
        message: "Invalid Project ID format in query.",
      });
    }
    filter.projectId = new mongoose.Types.ObjectId(query.projectId as string);
  }

  try {
    // Fetch tasks from the database, sorting by most recently created
    const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });
    return tasks;
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    throw createError({
      statusCode: 500,
      message: "An unexpected error occurred while fetching tasks.",
    });
  }
});
