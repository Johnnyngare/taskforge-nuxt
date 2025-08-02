// server/utils/validationSchemas.ts (create this file)
import { z } from "zod";

export const createTaskSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
    status: z.enum(["pending", "completed"]).default("pending"),
    dueDate: z.string().datetime().optional().or(z.literal(null)), // Handle optional Date string or null
    projectId: z.string().optional(), // Now optional
    // Ensure projectId is a valid MongoDB ObjectId if provided
  })
  .refine((data) => {
    // Custom validation: if projectId is provided, ensure it's a valid ObjectId string
    if (data.projectId && !data.projectId.match(/^[0-9a-fA-F]{24}$/)) {
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
