// server/api/projects/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import { ProjectModel } from "~/server/db/models/project";
import { TaskModel } from "~/server/db/models/task";
import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const ctxUser = event.context?.user;

  // 1. Auth check
  if (!ctxUser?.id) {
    console.warn("projects.get: Unauthorized attempt to fetch projects. No user context.");
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User not authenticated.",
    });
  }

  const role = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id);

  // 2. RBAC filter
  let filter: Record<string, any> = {};
  if (role !== "admin") {
    // Non-admins: see projects they own or are members of
    filter.$or = [{ owner: userId }, { members: userId }];
  }

  try {
    // 3. Fetch projects
    const projects = await ProjectModel.find(filter).lean();

    // 4. Append completion rate to each project
    const projectsWithCompletion = await Promise.all(
      projects.map(async (project) => {
        const [totalTasks, completedTasks] = await Promise.all([
          TaskModel.countDocuments({ projectId: project._id }),
          TaskModel.countDocuments({ projectId: project._id, status: "completed" }),
        ]);

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          ...project,
          completionRate: Math.round(completionRate),
        };
      })
    );

    return projectsWithCompletion;
  } catch (error) {
    console.error("projects.get: Database error", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch projects due to database error.",
    });
  }
});
