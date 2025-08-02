// server/api/projects/index.get.ts
// CORRECT IMPORT PATHS (matching your screenshot's lowercase filenames):
import { ProjectModel } from "~/server/db/models/project.ts"; // Changed to 'project.ts' (lowercase 'p')
import { TaskModel } from "~/server/db/models/task.ts"; // Ensure 'task.ts' (lowercase 't')

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filter: { status?: string; projectId?: string } = {};
  if (query.status) {
    filter.status = query.status as "pending" | "completed";
  }
  if (query.projectId) {
    filter.projectId = query.projectId as string;
  }

  // Use .find().lean() for simpler objects if you don't need Mongoose Document methods
  const projects = await ProjectModel.find(filter).lean();

  // If you calculate completionRate here, ensure TaskModel import is correct too
  for (const project of projects) {
    const totalTasks = await TaskModel.countDocuments({
      projectId: project._id,
    });
    const completedTasks = await TaskModel.countDocuments({
      projectId: project._id,
      status: "completed",
    });
    project.completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  return projects;
});
