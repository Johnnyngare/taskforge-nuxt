// file: server/api/tasks/index.post.ts

// 1. THE FIX: Import 'z' from the zod library
import { z } from "zod";
import mongoose from "mongoose"; // Import mongoose to use its Types
import { TaskModel } from "~/server/db/models/task.ts";

// 2. Define a validation schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  // projectId is optional, but if it exists, it should be a string
  projectId: z.string().optional().nullable(), // Allow it to be null from the form
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // 3. Validate the incoming request body against the schema
    const validatedData = createTaskSchema.parse(body);

    // Prepare the data for Mongoose, converting projectId to ObjectId if it exists
    const taskToCreate = {
      ...validatedData,
      // Only add projectId if it's a non-empty string
      projectId: validatedData.projectId
        ? new mongoose.Types.ObjectId(validatedData.projectId)
        : undefined,
    };

    const task = await TaskModel.create(taskToCreate);

    // Set HTTP status code for successful creation
    event.node.res.statusCode = 201;
    return task;
  } catch (error: any) {
    // 4. Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      event.node.res.statusCode = 400; // Bad Request
      return {
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      };
    }

    // 5. Handle other potential errors (e.g., Mongoose or database errors)
    console.error("Error creating task:", error);
    event.node.res.statusCode = 500; // Internal Server Error
    return {
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the task.",
    };
  }
});
