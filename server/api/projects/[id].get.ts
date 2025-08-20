// server/api/projects/[id].get.ts
import { getRouterParam, createError } from '#imports';
import mongoose from "mongoose";
import { ProjectModel } from "~/server/db/models/project";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { UserRole } from "~/types/user";
import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const rawProjectId = getRouterParam(event, 'id');
  const ctxUser = event.context?.user;

  if (!rawProjectId || !mongoose.Types.ObjectId.isValid(rawProjectId)) {
    throw createError({ statusCode: 400, message: "Invalid Project ID format." });
  }

  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    throw createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }

  const projectId = new mongoose.Types.ObjectId(rawProjectId);
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const userRole: UserRole = ctxUser.role as UserRole;

  try {
    const projectDoc = await ProjectModel.findById(projectId).lean();

    if (!projectDoc) {
      throw createError({ statusCode: 404, message: "Project not found." });
    }

    // RBAC Check (Updated for consistency with UserRole enum)
    let canAccess = false;
    if (userRole === UserRole.Admin) {
      canAccess = true;
    } else if (projectDoc.owner.equals(userId) || projectDoc.members?.some(memberId => memberId.equals(userId))) {
      canAccess = true;
    } else if (userRole === UserRole.Manager || userRole === UserRole.Dispatcher) { // Explicitly include Dispatcher
      // Assuming managers/dispatchers can access projects they own/member or manage specifically
      // If you have a 'managedProjects' array on the UserModel:
      const managerUser = await UserModel.findById(userId).select('managedProjects').lean();
      if (managerUser?.managedProjects?.some(mpId => mpId.equals(projectId))) {
        canAccess = true;
      }
      // If managers/dispatchers can generally view any project (less secure, but a valid rule)
      // canAccess = true; // Uncomment this line if Managers/Dispatchers can view any project
    }

    if (!canAccess) {
      throw createError({ statusCode: 403, message: "Forbidden: You do not have permission to view this project." });
    }

    // Aggregate tasks counts and costs
    const aggregationResult = await TaskModel.aggregate([
      { $match: { projectId: projectId } },
      {
        $group: {
          _id: '$projectId',
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalTasksCost: { $sum: '$cost' },
        },
      },
    ]);
    const aggregatedData = aggregationResult.length > 0 ? aggregationResult[0] : {};

    // Fetch the actual tasks associated with this project
    const associatedTasks = await TaskModel.find({ projectId: projectId })
      .populate('projectId', 'name') // Populate project details if needed by TaskList
      .sort({ createdAt: -1 })
      .lean();

    // Transform project document and add aggregated/associated task data
    const project = new ProjectModel(projectDoc).toJSON(); // Apply Mongoose transform

    const projectResponse = {
      ...project,
      totalTasks: aggregatedData.totalTasks || 0,
      completedTasks: aggregatedData.completedTasks || 0,
      completionRate: (aggregatedData.totalTasks || 0) > 0
        ? Math.round((aggregatedData.completedTasks / aggregatedData.totalTasks) * 100)
        : 0,
      totalTasksCost: aggregatedData.totalTasksCost || 0,
      tasks: associatedTasks.map(task => new TaskModel(task).toJSON()), // Include the tasks array
    };

    return projectResponse; // Return the full project object directly
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch project due to server error.",
      cause: error
    });
  }
});