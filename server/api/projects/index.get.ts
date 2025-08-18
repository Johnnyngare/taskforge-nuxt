// server/api/projects/index.get.ts
import { defineEventHandler, createError } from '#imports';
import { ProjectModel } from "~/server/db/models/project";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import mongoose from "mongoose";
import { UserRole } from "~/types/user";

export default defineEventHandler(async (event) => {
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;
  console.log("[API GET /projects] --- START Processing Request ---");

  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    console.warn("[API GET /projects] Unauthorized attempt to fetch projects. No complete user context.");
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const userRole = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id);

  try {
    let filter: Record<string, any> = {};

    // RBAC filter for fetching projects
    if (userRole === UserRole.Admin) {
      console.log("[API GET /projects] Admin fetching all projects.");
    } else {
      let orConditions: mongoose.FilterQuery<any>[] = [
        { owner: userId },
        { members: userId }
      ];

      if (userRole === UserRole.TeamManager) {
        const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
        if (managerDoc?.managedProjects && managerDoc.managedProjects.length > 0) {
          orConditions.push({ _id: { $in: managerDoc.managedProjects } });
          console.log(`[API GET /projects] TeamManager ${userId} has ${managerDoc.managedProjects.length} managed projects.`);
        }
      }
      filter.$or = orConditions;
      console.log(`[API GET /projects] Filtering projects for user ${userId} (role: ${userRole}). Filter: ${JSON.stringify(filter)}`);
    }

    // Removed .lean() so projectDocs are full Mongoose documents
    const projectDocs = await ProjectModel.find(filter)
      .sort({ createdAt: -1 });

    const projectsWithCompletion = await Promise.all(
      projectDocs.map(async (projectDoc) => {
        const projectIdForTasks = projectDoc._id;

        // Aggregate total and completed tasks for this project
        const taskStats = await TaskModel.aggregate([
          { $match: { projectId: projectIdForTasks } },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
            },
          },
        ]);

        const totalTasks = taskStats.length > 0 ? taskStats[0].totalTasks : 0;
        const completedTasks = taskStats.length > 0 ? taskStats[0].completedTasks : 0;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calls the .toJSON() method defined in your Mongoose schema
        const project = projectDoc.toJSON();

        return {
          ...project,
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          completionRate: Math.round(completionRate),
        };
      })
    );

    console.log(`[API GET /projects] Returning ${projectsWithCompletion.length} projects for user ${userId} (${userRole}).`);
    return {
      statusCode: 200,
      message: "Projects retrieved successfully",
      projects: projectsWithCompletion,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error("[API GET /projects] Server error fetching projects:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to fetch projects due to server error.",
      message: error.message,
    });
  } finally {
    console.log("[API GET /projects] --- END Request Processing ---");
  }
});