// server/api/projects/index.post.ts
import { defineEventHandler, readBody, createError } from "h3";
import { projectStore, type Project } from "~/server/utils/projectStore";

export default defineEventHandler(async (event) => {
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;

  if (!ctxUser || !ctxUser.id) {
    console.warn("[API POST /projects] Unauthorized attempt to create project. No user context.");
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const userRole = ctxUser.role;
  const userId = ctxUser.id;

  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'dispatcher') {
    console.warn(`[API POST /projects] Forbidden: User ${userId} (role: ${userRole}) attempted project creation.`);
    throw createError({
      statusCode: 403,
      message: `Forbidden: Your role (${userRole}) does not permit project creation.`,
    });
  }

  const body = await readBody(event);
  console.log("[API POST /projects] Received project creation request body:", body);

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({
      statusCode: 400,
      message: "Bad Request: Project name is required and must be a non-empty string.",
    });
  }

  const isValidDateISO = (dateString: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateString);
  if (body.startDate && (typeof body.startDate !== 'string' || !isValidDateISO(body.startDate))) {
    throw createError({ statusCode: 400, message: 'Bad Request: startDate must be a valid ISO string if provided.' });
  }
  if (body.endDate && (typeof body.endDate !== 'string' || !isValidDateISO(body.endDate))) {
    throw createError({ statusCode: 400, message: 'Bad Request: endDate must be a valid ISO string if provided.' });
  }

  const newProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'completedTasks' | 'totalTasks' | 'completionRate'> = {
    name: body.name,
    description: body.description?.trim() || null,
    status: body.status || 'active',
    priority: body.priority || 'medium',
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    owner: userId,
    members: body.members || [userId],
  };

  try {
    const createdProject = projectStore.addProject(newProjectData);

    return {
      statusCode: 201,
      message: "Project created successfully!",
      project: createdProject,
    };
  } catch (error: any) {
    console.error("[API POST /projects] Server error creating project:", error?.message || error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create project due to server error.",
      message: error.message,
    });
  }
});