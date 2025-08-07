// server/api/projects/index.get.ts
import { defineEventHandler, getQuery } from "h3";
// FIX: Remove .ts extensions from imports
import { ProjectModel } from "~/server/db/models/project";
import { TaskModel } from "~/server/db/models/task";

export default defineEventHandler(async (event) => {

  // Define a type for the project object after adding completionRate
  type ProjectWithCompletion = Awaited<
    ReturnType<typeof ProjectModel.find>
  >[number] & {
    completionRate?: number;
  };

  try {
    // Use .lean() for performance as we are modifying the objects
    const projects = await ProjectModel.find({}).lean();

    // Use Promise.all for more efficient parallel database queries
    const projectsWithCompletion = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await TaskModel.countDocuments({
          projectId: project._id,
        });
        const completedTasks = await TaskModel.countDocuments({
          projectId: project._id,
          status: "completed",
        });

        const completionRate =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Return a new object with the added property
        return {
          ...project,
          completionRate: Math.round(completionRate), // Round to nearest integer
        };
      })
    );

    return projectsWithCompletion;
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch projects.",
    });
  }
});
