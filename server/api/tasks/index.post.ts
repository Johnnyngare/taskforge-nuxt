// server/api/tasks/index.post.ts
import { defineEventHandler, readBody, setResponseStatus, createError } from "h3";
import { z } from "zod";
import mongoose from "mongoose";

import { TaskPriority, TaskStatus } from "~/types/task";
import { TaskModel, type IMongooseTask } from "~/server/db/models/task";

const getEnumValues = <T extends Record<string, string>>(
  enumObject: T
): [T[keyof T], ...T[keyof T][]] => {
  const values = Object.values(enumObject);
  return values as [T[keyof T], ...T[keyof T][]];
};

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  priority: z.enum(getEnumValues(TaskPriority)).default(TaskPriority.Medium),
  status: z.enum(getEnumValues(TaskStatus)).default(TaskStatus.Pending),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional()
    .nullable(),
});

export default defineEventHandler(async (event) => {
  // ✅ Ensure user is authenticated
  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User not authenticated.",
    });
  }

  const body = await readBody(event);

  try {
    const validatedData = createTaskSchema.parse(body);

    // ✅ Build the Mongoose task object
    const taskToCreate: Partial<IMongooseTask> = {
      title: validatedData.title,
      description: validatedData.description || undefined,
      status: validatedData.status,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : undefined,
      projectId: validatedData.projectId
        ? new mongoose.Types.ObjectId(validatedData.projectId)
        : undefined,
      userId: new mongoose.Types.ObjectId(ctxUser.id), // ✅ Link task to creator
    };

    const task = await TaskModel.create(taskToCreate);

    setResponseStatus(event, 201);
    return task.toJSON(); // Mongoose toJSON will format for frontend
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("tasks.post: Validation failed", error.flatten().fieldErrors);
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error.flatten().fieldErrors,
      });
    }
    console.error("tasks.post: Error creating task", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
