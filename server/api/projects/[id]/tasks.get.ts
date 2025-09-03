// server/api/projects/[id]/tasks.get.ts
import { defineEventHandler, createError } from "h3";
import { TaskModel } from "~/server/db/models/task";

export default defineEventHandler(async (event) => {
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID is required.",
    });
  }

  try {
    const tasks = await TaskModel.find({ projectId });
    return tasks;
  } catch (error: any) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch tasks for the project.",
    });
  }
});
