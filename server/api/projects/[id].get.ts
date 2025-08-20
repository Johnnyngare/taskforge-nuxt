// server/api/projects/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from '#imports';
import mongoose from "mongoose";
import { ProjectModel } from "~/server/db/models/project";
import { TaskModel } from "~/server/db/models/task";
import { UserRole } from "~/types/user";

export default defineEventHandler(async (event) => {
  const rawProjectId = getRouterParam(event, 'id');
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;

  if (!rawProjectId || !mongoose.Types.ObjectId.isValid(rawProjectId)) {
    console.warn(`[API GET /projects/:id] Bad Request: Invalid Project ID format provided: ${rawProjectId}.`);
    throw createError({
      statusCode: 400,
      message: "Bad Request: Invalid Project ID format.",
    });
  }

  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    console.warn(`[API GET /projects/:id] Unauthorized attempt to fetch project ${rawProjectId}. No complete user context.`);
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const projectId = new mongoose.Types.ObjectId(rawProjectId);
  const userRole = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id);

  try {
    // Fetches a full Mongoose document, which has .toJSON()
    const projectDoc = await ProjectModel.findById(projectId);

    if (!projectDoc) {
      console.warn(`[API GET /projects/:id] Project ${rawProjectId} not found.`);
      throw createError({
        statusCode: 404,
        message: "Project not found.",
      });
    }

    // RBAC check for single project access (remains unchanged, as it was correct)
    let canAccess = false;
    if (userRole === UserRole.Admin) {
      canAccess = true;
    } else if (projectDoc.owner.equals(userId) || projectDoc.members.some(memberId => memberId.equals(userId))) {
      canAccess = true;
    } else if (userRole === UserRole.TeamManager) {
      // Assuming a manager can access projects they manage (if such a relationship exists)
      // This part would depend on your UserModel or a separate "managedProjects" field for managers
      // For now, let's assume team managers only access projects where they are owner/member.
      // If you have 'managedProjects' array on UserModel, you'd check it here.
      canAccess = false; // Default
    }

    if (!canAccess) {
      console.warn(`[API GET /projects/:id] Forbidden: User ${userId} (role: ${userRole}) attempted to access project ${rawProjectId} without permission.`);
      throw createError({
        statusCode: 403,
        message: "Forbidden: You do not have permission to view this project.",
      });
    }

    // Aggregate total cost of tasks for this project using ObjectId for projectId
    let totalTasksCost: number = 0;
    try {
      const aggregationResult = await TaskModel.aggregate([
        { $match: { projectId: projectId } }, // Match tasks by projectId (now an ObjectId)
        { $group: { _id: null, totalCost: { $sum: "$cost" } } }
      ]);

      if (aggregationResult.length > 0) {
        totalTasksCost = aggregationResult[0].totalCost || 0;
      }
      console.log(`[API GET /projects/:id] Aggregated task cost for project ${rawProjectId}: $${totalTasksCost}`);
    } catch (aggError: any) {
      console.error(`[API GET /projects/:id] Error aggregating task costs for project ${rawProjectId}:`, aggError.message || aggError, aggError.stack);
      totalTasksCost = 0;
    }

    // Convert Mongoose Document to plain JS object and add totalTasksCost
    // This will now correctly call the .toJSON() method defined in your Mongoose schema
    const project = projectDoc.toJSON();
    const projectWithCost = {
      ...project,
      totalTasksCost: totalTasksCost,
    };

    console.log(`[API GET /projects/:id] Successfully fetched project ${rawProjectId} for user ${userId} (${userRole}).`);
    return {
      statusCode: 200,
      message: "Project retrieved successfully",
      project: projectWithCost,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error(`[API GET /projects/:id] Server error fetching project ${rawProjectId}:`, error?.message || error, error.stack);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to fetch project due to server error.",
      message: error.message,
      cause: error
    });
  }
});