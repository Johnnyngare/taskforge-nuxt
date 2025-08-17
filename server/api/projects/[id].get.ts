// server/api/projects/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from '#imports'; // CHANGED: Imported from '#imports'
import { projectStore } from "~/server/utils/projectStore";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id');
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;

  if (!projectId) {
    console.warn("[API GET /projects/:id] Bad Request: Project ID is missing.");
    throw createError({
      statusCode: 400,
      message: "Bad Request: Project ID is required.",
    });
  }

  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    console.warn(`[API GET /projects/:id] Unauthorized attempt to fetch project ${projectId}. No complete user context.`);
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const userRole = ctxUser.role;
  const userId = ctxUser.id;

  try {
    const project = projectStore.findProjectById(projectId, userRole, userId);

    if (!project) {
      console.warn(`[API GET /projects/:id] Project ${projectId} not found or access denied for user ${userId} (${userRole}).`);
      throw createError({
        statusCode: 404,
        message: "Project not found or access denied.",
      });
    }

    console.log(`[API GET /projects/:id] Successfully fetched project ${projectId} for user ${userId} (${userRole}).`);
    return {
      statusCode: 200,
      message: "Project retrieved successfully",
      project: project,
    };
  } catch (error: any) {
    console.error(`[API GET /projects/:id] Server error fetching project ${projectId}:`, error?.message || error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch project due to server error.",
      message: error.message,
    });
  }
});