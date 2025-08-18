// server/api/projects/index.post.ts
import { defineEventHandler, readBody, createError, setResponseStatus } from '#imports';
import { z } from "zod";
import mongoose from "mongoose"; // Import mongoose to use ObjectId
import { ProjectModel } from "~/server/db/models/project"; // Import your Mongoose ProjectModel
import { ProjectStatus, ProjectPriority } from "~/types/project";

// Define a Zod schema for project creation payload
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.Active),
  priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.Medium),
  startDate: z.string().datetime({ message: "Invalid startDate format (ISO string required)." }).optional().nullable(),
  endDate: z.string().datetime({ message: "Invalid endDate format (ISO string required)." }).optional().nullable(),
  budget: z.number().min(0, "Budget cannot be negative.").optional().nullable(),
  // Ensure members are validated as valid ObjectIds (if frontend sends them)
  members: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid member ID format.")).optional(),
});

export default defineEventHandler(async (event) => {
  console.log("[API POST /projects] --- START Request Processing ---");
  console.log('[API POST /projects] 1. Request received by server.');

  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;
  console.log("[API POST /projects] 2. User Context (from middleware):", ctxUser ? { id: ctxUser.id, role: ctxUser.role, name: ctxUser.name } : "Not set");

  if (!ctxUser || !ctxUser.id) {
    console.warn("[API POST /projects] Unauthorized attempt to create project. No user context.");
    setResponseStatus(event, 401);
    throw createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }

  const userRole = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id); // Convert userId to ObjectId

  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'dispatcher') {
    console.warn(`[API POST /projects] Forbidden: User ${userId} (role: ${userRole}) lacks permission.`);
    setResponseStatus(event, 403);
    throw createError({ statusCode: 403, message: `Forbidden: Your role (${userRole}) does not permit project creation.` });
  }
  console.log("[API POST /projects] 3. User authorized for creation based on role.");

  let rawBody: any;
  try {
    rawBody = await readBody(event);
    console.log("[API POST /projects] 4. Raw request body read:", JSON.stringify(rawBody));
  } catch (readBodyError) {
    console.error("[API POST /projects] 4.1 ERROR reading request body:", readBodyError);
    setResponseStatus(event, 400);
    throw createError({ statusCode: 400, message: "Invalid request body format." });
  }

  try {
    console.log("[API POST /projects] 5. Attempting Zod validation...");
    const validatedData = createProjectSchema.parse(rawBody);
    console.log("[API POST /projects] 6. Zod validation passed. ValidatedData:", JSON.stringify(validatedData));

    // Prepare data for Mongoose, converting string IDs to ObjectIDs
    const projectDataToCreate = {
      name: validatedData.name,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      budget: validatedData.budget !== undefined && validatedData.budget !== null ? validatedData.budget : 0, // Default budget to 0 if null/undefined
      owner: userId, // Owner is already ObjectId
      members: validatedData.members && validatedData.members.length > 0
               ? validatedData.members.map(id => new mongoose.Types.ObjectId(id))
               : [userId], // Ensure members are ObjectIds
    };
    console.log("[API POST /projects] 7. Prepared projectDataToCreate for Mongoose:", JSON.stringify(projectDataToCreate));

    console.log("[API POST /projects] 8. Attempting to create project in MongoDB...");
    let createdProjectDoc;
    try {
        createdProjectDoc = await ProjectModel.create(projectDataToCreate); // *** KEY CHANGE: Use Mongoose Model ***
        console.log("[API POST /projects] 9. Project successfully created in DB. ID:", createdProjectDoc._id);
    } catch (dbError: any) {
        console.error("[API POST /projects] CRITICAL ERROR: Failed to create project in DB. Error details:", dbError);
        setResponseStatus(event, 500);
        throw createError({
            statusCode: 500,
            message: "Failed to save project to database.",
            cause: dbError,
            data: { message: dbError.message, stack: dbError.stack }
        });
    }

    // Use .toJSON() to apply the transform that converts _id to id and ObjectIds to strings
    const createdProject = createdProjectDoc.toJSON();

    console.log("[API POST /projects] --- END Request Processing (Success) ---");
    setResponseStatus(event, 201);
    return {
      statusCode: 201,
      message: "Project created successfully!",
      project: createdProject, // Return the transformed object
    };
  } catch (error: any) {
    console.error("[API POST /projects] CRITICAL ERROR: Unhandled exception in main try block:", error);
    let errorMessage = "An unexpected server error occurred.";
    let statusCode = 500;
    let errorData: any = null;

    if (error instanceof z.ZodError) {
      statusCode = 400;
      errorMessage = "Validation failed for project data.";
      errorData = error.flatten().fieldErrors;
    } else if (error.statusCode) { // H3Error
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorData = error.data;
    } else { // Generic Error
      errorMessage = error.message || errorMessage;
      errorData = error.stack;
    }

    setResponseStatus(event, statusCode);
    throw createError({
      statusCode: statusCode,
      statusMessage: errorMessage,
      message: errorMessage,
      data: errorData,
      cause: error
    });
  } finally {
    console.log("[API POST /projects] --- FINALLY block executed ---");
  }
});