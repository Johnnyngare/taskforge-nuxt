// file: server/api/tasks/index.post.ts
import { z } from "zod";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task.ts";
import { TaskPriority, TaskStatus } from "~/server/db/models/task.ts"; // Import enums

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  // Add priority and status validation/defaulting
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.Medium), // <--- NEW: Default priority
  status: z.nativeEnum(TaskStatus).default(TaskStatus.Pending), // <--- NEW: Default status
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const validatedData = createTaskSchema.parse(body);

    const taskToCreate = {
      ...validatedData,
      projectId: validatedData.projectId
        ? new mongoose.Types.ObjectId(validatedData.projectId)
        : undefined,
    };

    const task = await TaskModel.create(taskToCreate);
    event.node.res.statusCode = 201;
    return task;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      event.node.res.statusCode = 400;
      return {
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      };
    }
    console.error("Error creating task:", error);
    event.node.res.statusCode = 500;
    return {
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the task.",
    };
  }
});
