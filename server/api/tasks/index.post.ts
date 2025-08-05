import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "~/server/db";
import { TaskModel, TaskPriority, TaskStatus } from "~/server/db/models/task"; // Remove .ts extensions

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.Medium),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.Pending),
});

export default defineEventHandler(async (event) => {
  // Connect to database
  await connectDB();

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

    // Set status code and return the created task
    setResponseStatus(event, 201);
    return task;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error.flatten().fieldErrors,
      });
    }

    console.error("Error creating task:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "An unexpected error occurred while creating the task.",
    });
  }
});
