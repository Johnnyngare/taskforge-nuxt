// server/api/tasks/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import type { ITask } from "~/types/task";

export default defineEventHandler(async (event) => {
  // CRITICAL FIX: Robustly access ctxUser.
  // Although middleware sets it, in async/SSR scenarios, it can sometimes appear undefined
  // if accessed too early or if the request is subtly different.
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;
  console.log(`[API GET /tasks] --- START Processing Request --- URL: ${event.node?.req?.url}`);
  console.log("[API GET /tasks] User Context on entry (from middleware):", ctxUser ? { id: ctxUser.id, role: ctxUser.role, name: ctxUser.name } : "Not set (or null)");


  // 1. Authentication Check (now relies on middleware having fully authenticated)
  // This check MUST be reliable.
  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    console.warn("[API GET /tasks] Unauthorized attempt to fetch tasks. No complete user context. ctxUser:", ctxUser);
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const role = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  console.log(`[API GET /tasks] Authenticated User: ${userId} (Role: ${role})`);

  const query = getQuery(event) as Record<string, any>;
  let filter: Record<string, any> = {};
  const andConditions: Record<string, any>[] = [];

  // Add task status filter if present
  if (query.status) {
    andConditions.push({ status: query.status });
  }

  // 1. RBAC for `tasks.get` (Who can *see* which tasks)
  if (role === "admin") {
    console.log("[API GET /tasks] Admin fetching all tasks (no additional RBAC filter applied).");
  } else {
    // Non-admins: Filter based on ownership or project membership/management
    const accessibleProjectIds: mongoose.Types.ObjectId[] = [];

    const [ownedProjects, memberProjects] = await Promise.all([
      ProjectModel.find({ owner: userId }).select('_id').lean(),
      ProjectModel.find({ members: userId }).select('_id').lean()
    ]);
    accessibleProjectIds.push(...ownedProjects.map(p => p._id));
    accessibleProjectIds.push(...memberProjects.map(p => p._id));

    if (role === "manager") { // Assuming 'manager' role for TeamManager
      const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
      if (managerDoc?.managedProjects) {
        accessibleProjectIds.push(...managerDoc.managedProjects.map(id => new mongoose.Types.ObjectId(id)));
      }
    }
    
    const uniqueAccessibleProjectIds = [...new Set(accessibleProjectIds.filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
    console.log(`[API GET /tasks] User ${userId} (${role}) has access to projects: ${uniqueAccessibleProjectIds.length} unique IDs.`);

    andConditions.push({
      $or: [
        { userId: userId }, // Task is owned by user
        { assignedTo: userId }, // Task is assigned to user
        { projectId: { $in: uniqueAccessibleProjectIds } } // Task belongs to an accessible project
      ],
    });
  }

  // 2. Project ID Filter (from query param)
  if (query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(query.projectId)) {
      console.warn(`[API GET /tasks] Invalid Project ID format in query: ${query.projectId}`);
      throw createError({ statusCode: 400, message: "Invalid Project ID format." });
    }
    const queryProjectId = new mongoose.Types.ObjectId(query.projectId);
    andConditions.push({ projectId: queryProjectId });
  }
  console.log(`[API GET /tasks] Filter conditions before final build: ${andConditions.length} conditions`);


  // Combine all conditions
  if (andConditions.length > 0) {
    filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
  }
  console.log("[API GET /tasks] Final MongoDB filter:", JSON.stringify(filter));


  // 3. Query DB
  try {
    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const transformedTasks: ITask[] = tasks.map(task => {
        const plainTask: ITask = {
            id: String(task._id),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
            projectId: task.projectId ? String(task.projectId) : undefined,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            userId: String(task.userId),
            assignedTo: task.assignedTo ? task.assignedTo.map(String) : [],
        };
        return plainTask;
    });

    console.log(`[API GET /tasks] Successfully retrieved ${transformedTasks.length} tasks.`);
    return {
      statusCode: 200,
      message: "Tasks retrieved successfully",
      tasks: transformedTasks,
    };
  } catch (err: any) {
    console.error("[API GET /tasks] DB query error:", err?.message || err, err);
    throw createError({
      statusCode: err.statusCode || 500,
      message: "Failed to fetch tasks due to database error.",
    });
  } finally {
    console.log("[API GET /tasks] --- END Request Processing ---");
  }
});