// server/api/projects/index.post.ts
import { defineEventHandler, readBody, createError, setResponseStatus } from '#imports'; // CHANGED: Imported from '#imports'
import { projectStore, type Project } from "~/server/utils/projectStore";
import { z } from "zod";
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
  members: z.array(z.string().min(1, "Member ID cannot be empty.")).optional(),
});

export default defineEventHandler(async (event) => {
  console.log("[API POST /projects] --- START Request Processing ---");
  console.log('[API POST /projects] 1. Request received by server.');

  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;
  console.log("[API POST /projects] 2. User Context (from middleware):", ctxUser ? { id: ctxUser.id, role: ctxUser.role, name: ctxUser.name } : "Not set");

  if (!ctxUser || !ctxUser.id) {
    console.warn("[API POST /projects] Unauthorized attempt to create project. No user context.");
    setResponseStatus(event, 401);
    return createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }

  const userRole = ctxUser.role;
  const userId = ctxUser.id;

  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'dispatcher') {
    console.warn(`[API POST /projects] Forbidden: User ${userId} (role: ${userRole}) lacks permission.`);
    setResponseStatus(event, 403);
    return createError({ statusCode: 403, message: `Forbidden: Your role (${userRole}) does not permit project creation.` });
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

    const newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'completedTasks' | 'totalTasks' | 'completionRate'> & { budget?: number | null } = {
      name: validatedData.name,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      startDate: validatedData.startDate || null,
      endDate: validatedData.endDate || null,
      budget: validatedData.budget !== undefined ? validatedData.budget : null,
      owner: userId,
      members: validatedData.members && validatedData.members.length > 0
               ? validatedData.members
               : [userId],
    };
    console.log("[API POST /projects] 7. Prepared newProjectData for store:", JSON.stringify(newProjectData));

    console.log("[API POST /projects] 8. Attempting to add project to store (projectStore.addProject)...");
    let createdProject: Project;
    try {
        createdProject = projectStore.addProject(newProjectData);
        console.log("[API POST /projects] 9. Project successfully added to store. ID:", createdProject.id);
    } catch (storeError: any) {
        console.error("[API POST /projects] CRITICAL ERROR: Failed to add project to store. Error details:", storeError);
        console.error("[API POST /projects] CRITICAL ERROR: Stack trace:", storeError.stack);
        setResponseStatus(event, 500);
        throw createError({
            statusCode: 500,
            message: "Failed to save project to internal store.",
            cause: storeError,
            data: { message: storeError.message, stack: storeError.stack }
        });
    }

    console.log("[API POST /projects] --- END Request Processing (Success) ---");
    setResponseStatus(event, 201);
    return {
      statusCode: 201,
      message: "Project created successfully!",
      project: createdProject,
    };
  } catch (error: any) {
    console.error("[API POST /projects] CRITICAL ERROR: Unhandled exception in main try block:", error);
    console.error("[API POST /projects] CRITICAL ERROR: Stack trace (from main catch):", error.stack);

    let errorMessage = "An unexpected server error occurred.";
    let statusCode = 500;
    let errorData: any = null;

    if (error instanceof z.ZodError) {
      statusCode = 400;
      errorMessage = "Validation failed for project data.";
      errorData = error.flatten().fieldErrors;
    } else if (error.statusCode) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorData = error.data;
    } else {
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