// server/api/tasks/index.get.ts
// REMOVED: import { defineEventHandler, createError, getQuery } from "h3";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { ProjectModel } from "~/server/db/models/project"; // Assuming ProjectModel might be needed for filter logic
import { UserModel } from "~/server/db/models/user"; // Assuming UserModel might be needed for filter logic
import type { H3Event } from 'h3'; // Import H3Event for explicit typing

export default defineEventHandler(async (event: H3Event) => { // ADDED: Explicitly type 'event'
  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const filter = await buildTaskFilter(ctxUser, event);

  try {
    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('projectId', 'name')
      .lean();

    return tasks.map(task => new TaskModel(task).toJSON());

  } catch (err: any) {
    console.error("[API GET /tasks] DB query error:", err);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch tasks due to a database error.",
    });
  }
});

// Helper function to contain your complex filter logic
const buildTaskFilter = async (ctxUser: any, event: H3Event) => { // ADDED: Explicitly type 'event'
  const query = getQuery(event) as Record<string, any>;
  let andConditions: Record<string, any>[] = [];

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  if (ctxUser.role !== 'admin') {
    const userId = new mongoose.Types.ObjectId(ctxUser.id);
    andConditions.push({
      $or: [
        { userId: userId },
        { assignedTo: userId },
      ],
    });
  }
  
  if (query.projectId) {
    andConditions.push({ projectId: new mongoose.Types.ObjectId(query.projectId) });
  }

  return andConditions.length > 0 ? { $and: andConditions } : {};
};