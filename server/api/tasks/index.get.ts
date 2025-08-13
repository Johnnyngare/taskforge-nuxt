// server/api/tasks/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import type { ITask } from "~/types/task"; // Import ITask for type consistency

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
    // Current filter is { userId: userId }. If Field Officers also need to see tasks
    // assigned to them by others (where their ID is in task.assignedTo), add here.
    // Example: andConditions.push({ $or: [{ userId: userId }, { assignedTo: userId }] });
  } else if (role === "dispatcher") {
    // Current filter is { userId: userId }. Add dispatcher-specific RBAC rules here if needed.
  }

  // 4. Combine filter
  if (andConditions.length > 0) {
    filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
  }

  // 5. Query DB
  try {
    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .lean(); // .lean() is here, so transform manually below.

    // FIX: Manually transform _id to id and remove __v for .lean() results
    const transformedTasks: ITask[] = tasks.map(task => {
        const plainTask: ITask = {
            id: String(task._id), // Convert ObjectId to string and map to 'id'
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
            projectId: task.projectId ? String(task.projectId) : undefined,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            userId: String(task.userId) // Ensure userId is also a string
        };
        // Explicitly delete _id and __v if you don't want them
        delete (plainTask as any)._id; 
        delete (plainTask as any).__v;
        return plainTask;
    });

    return transformedTasks || [];
  } catch (err) {
    console.error("tasks.get: DB query error", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch tasks due to database error.",
    });
  }
});