// server/api/tasks/index.post.ts
import { z } from "zod";
import mongoose from "mongoose";
// FIX: Import enums from the shared types file
// Change these lines:
import { TaskPriority, TaskStatus, type ITask } from "~/types/task";
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
  const body = await readBody(event);

  try {
    const validatedData = createTaskSchema.parse(body);

    // FIX: Type this object with the Mongoose interface, not the frontend one.
    // This resolves the type errors for `dueDate` and `projectId`.
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
    };

    const task = await TaskModel.create(taskToCreate);

    setResponseStatus(event, 201);
    // The .toJSON() transform correctly converts the Mongoose object
    // into the frontend-compatible ITask shape.
    return task.toJSON();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Failed:", error.flatten().fieldErrors);
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
    });
  }
});
