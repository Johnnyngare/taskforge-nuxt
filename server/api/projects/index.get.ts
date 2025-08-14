// server/api/projects/index.get.ts
import { defineEventHandler, createError } from "h3";
// IMPORTANT: You need to import your actual Project and Task models.
// If your models are using Mongoose, you'll need `mongoose` for `Types.ObjectId`.
import { ProjectModel } from "~/server/db/models/project";
import { TaskModel } from "~/server/db/models/task"; // Assuming TaskModel for completion rate
import mongoose from "mongoose";
import { projectStore } from "~/server/utils/projectStore";

export default defineEventHandler(async (event) => {
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;

  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    console.warn("[API GET /projects] Unauthorized attempt to fetch projects. No complete user context.");
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const userRole = ctxUser.role;
  const userId = ctxUser.id;

  try {
    const projects = projectStore.getProjects(userId, userRole);

    // --- Mongoose/Database Example ---
    /*
    let filter: Record<string, any> = {};
    if (userRole !== "admin") {
      filter.$or = [
        { owner: new mongoose.Types.ObjectId(userId) },
        { members: new mongoose.Types.ObjectId(userId) }
      ];
    }
    const projects = await ProjectModel.find(filter).lean();
    */

    const projectsWithCompletion = await Promise.all(
      projects.map(async (project) => {
        const projectIdForTasks = project.id;
        
        let totalTasks = 0;
        let completedTasks = 0;

        /*
        try {
          const [dbTotalTasks, dbCompletedTasks] = await Promise.all([
            TaskModel.countDocuments({ projectId: new mongoose.Types.ObjectId(projectIdForTasks) }),
            TaskModel.countDocuments({ projectId: new mongoose.Types.ObjectId(projectIdForTasks), status: "completed" }),
          ]);
          totalTasks = dbTotalTasks;
          completedTasks = dbCompletedTasks;
        } catch (taskErr) {
          console.warn(`[API GET /projects] Failed to count tasks for project ${projectIdForTasks}:`, (taskErr as Error).message);
        }
        */

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

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
    console.error("[API GET /projects] Server error fetching projects:", error?.message || error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch projects due to server error.",
      message: error.message,
    });
  }
});