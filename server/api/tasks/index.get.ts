// server/api/tasks/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, any>;
  const ctxUser = event.context?.user;

  // 1. Authentication check
  if (!ctxUser?.id) {
    console.warn("tasks.get: Unauthorized attempt to fetch tasks. No user context.");
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User not authenticated.",
    });
  }

  const role = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id);

  // 2. Build filter and conditions
  let filter: Record<string, any> = {};
  const andConditions: Record<string, any>[] = [];

  // Default ownership condition
  if (role !== "admin") {
    andConditions.push({ userId: userId });
  }

  // Query param filters
  if (query.status) {
    andConditions.push({ status: query.status });
  }
  if (query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(query.projectId)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid Project ID format." });
    }
    andConditions.push({ projectId: new mongoose.Types.ObjectId(query.projectId) });
  }

  // 3. Role-based access control
  if (role === "admin") {
    // Admins see everything (no userId restriction)
  } else if (role === "team_manager") {
    try {
      const managerDoc = await UserModel.findById(userId)
        .select("managedProjects")
        .lean();
      const managedProjectIds =
        managerDoc?.managedProjects?.map((id: string) => new mongoose.Types.ObjectId(id)) || [];

      if (managedProjectIds.length > 0) {
        // Manager can see own tasks OR tasks in managed projects
        andConditions.push({
          $or: [{ userId: userId }, { projectId: { $in: managedProjectIds } }],
        });
      }
    } catch (err) {
      console.error("tasks.get: error fetching manager projects for RBAC", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Error applying manager role filter.",
      });
    }
  } else if (role === "field_officer") {
    // Already restricted to own tasks
    // Could also allow assignedTo: userId if desired
  } else if (role === "dispatcher") {
    // Currently sees only their own tasks
    // Add dispatcher-specific RBAC rules here if needed
  }

  // 4. Combine filter
  if (andConditions.length > 0) {
    filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
  }

  // 5. Query DB
  try {
    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return tasks || [];
  } catch (err) {
    console.error("tasks.get: DB query error", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch tasks due to database error.",
    });
  }
});
