import { TaskModel } from "~/server/db/models/task.ts"; // Correct import path
import mongoose from "mongoose"; // Needed for ObjectId validation
import { z } from "zod"; // If you want to use Zod for body validation

// Optional: Define a Zod schema for PATCH updates if your updates are complex
// For simplicity, we'll assume body can contain title, description, status, dueDate, projectId
// If status can only be 'pending'/'completed', you'd validate that.
const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["pending", "completed"]).optional(),
    dueDate: z.string().datetime().optional().or(z.literal(null)),
    projectId: z.string().optional().nullable(),
    // Add other fields that can be updated
  })
  .refine((data) => {
    // Custom validation for projectId if provided
    if (data.projectId && !mongoose.Types.ObjectId.isValid(data.projectId)) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Invalid Project ID format",
          path: ["projectId"],
        },
      ]);
    }
    return true;
  });

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id as string; // Safely access .id and cast
  const body = await readBody(event);

  // 1. Validate taskId first
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    event.node.res.statusCode = 400;
    return { error: "Invalid Task ID provided" };
  }

  try {
    // 2. Optional: Validate body with Zod
    // const validatedBody = updateTaskSchema.parse(body); // Uncomment if using Zod

    // Prepare updates, converting projectId string to ObjectId if present
    const updates: any = { ...body }; // Start with all body fields
    if (updates.projectId) {
      // Convert to ObjectId if it exists and is a valid format
      if (mongoose.Types.ObjectId.isValid(updates.projectId)) {
        updates.projectId = new mongoose.Types.ObjectId(updates.projectId);
      } else {
        // Handle case where projectId is provided but invalid
        event.node.res.statusCode = 400;
        return { error: "Invalid Project ID format in request body" };
      }
    } else if (updates.projectId === null) {
      // Allow setting projectId to null/undefined to unassign
      updates.projectId = undefined;
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updates, {
      new: true,
    });

    if (!updatedTask) {
      event.node.res.statusCode = 404;
      return { error: "Task not found" };
    }

    return updatedTask;
  } catch (error: any) {
    // Handle Zod validation errors for body
    if (error instanceof z.ZodError) {
      // Uncomment if using Zod
      event.node.res.statusCode = 400;
      return {
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      };
    }
    console.error("Error updating task:", error);
    event.node.res.statusCode = 500;
    return { error: "Internal Server Error", message: error.message };
  }
});
