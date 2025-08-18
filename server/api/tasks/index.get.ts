// server/api/tasks/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import type { ITask } from "~/types/task";

export default defineEventHandler(async (event) => {
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;
  console.log(`[API GET /tasks] --- START Processing Request --- URL: ${event.node?.req?.url}`);
  console.log("[API GET /tasks] User Context on entry (from middleware):", ctxUser ? { id: ctxUser.id, role: ctxUser.role, name: ctxUser.name } : "Not set (or null)");

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
  let andConditions: Record<string, any>[] = [];

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  // 1. RBAC for `tasks.get` (Who can *see* which tasks)
  if (role === "admin") {
    console.log("[API GET /tasks] Admin fetching all tasks (no additional RBAC filter applied).");
  } else {
    // Collect all project ObjectIds that the user has access to
    const accessibleProjectObjectIds: mongoose.Types.ObjectId[] = [];

    const [ownedProjects, memberProjects] = await Promise.all([
      ProjectModel.find({ owner: userId }).select('_id').lean(),
      ProjectModel.find({ members: userId }).select('_id').lean()
    ]);
    accessibleProjectObjectIds.push(...ownedProjects.map(p => p._id));
    accessibleProjectObjectIds.push(...memberProjects.map(p => p._id));

    if (role === "manager") {
      const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
      if (managerDoc?.managedProjects) {
        accessibleProjectObjectIds.push(...managerDoc.managedProjects.map(id => new mongoose.Types.ObjectId(id)));
      }
    }
    
    // Ensure uniqueness for ObjectIds
    const uniqueAccessibleProjectObjectIds = [...new Set(accessibleProjectObjectIds.filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
    console.log(`[API GET /tasks] User ${userId} (${role}) has access to ${uniqueAccessibleProjectObjectIds.length} unique projects.`);

    // CRITICAL FIX: Build $or condition for filtering tasks
    andConditions.push({
      $or: [
        { userId: userId }, // Task is owned by user (ObjectId)
        { assignedTo: userId }, // Task is assigned to user (ObjectId)
        // Task belongs to an accessible project (projectId is ObjectId)
        { projectId: { $in: uniqueAccessibleProjectObjectIds } } 
      ],
    });
  }

  // 2. Project ID Filter (from query param) - if provided, refine the filter further
  if (query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(query.projectId)) {
      console.warn(`[API GET /tasks] Invalid Project ID format in query: ${query.projectId}`);
      throw createError({ statusCode: 400, message: "Invalid Project ID format." });
    }
    const queryProjectId = new mongoose.Types.ObjectId(query.projectId); // Convert to ObjectId for query
    andConditions.push({ projectId: queryProjectId });
  }
  console.log(`[API GET /tasks] Filter conditions before final build: ${andConditions.length} conditions`);

  if (andConditions.length > 0) {
    filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
  }
  console.log("[API GET /tasks] Final MongoDB filter:", JSON.stringify(filter));

  try {
    // Populate projectId field to get project name for frontend display
    // This relies on `TaskModel.projectId` being `mongoose.Types.ObjectId` with `ref: 'Project'`
    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('projectId', 'name') // Populate projectId and select only 'name'
      .lean(); // Use lean() AFTER populate()

    const transformedTasks: ITask[] = tasks.map(task => {
        const plainTask: ITask = {
            id: String(task._id),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            userId: String(task.userId),
            assignedTo: task.assignedTo ? task.assignedTo.map(String) : [],
            cost: task.cost,
        };
        
        // Handle projectId (it should be an ObjectId by now, possibly populated)
        if (task.projectId) {
          if (typeof task.projectId === 'object' && (task.projectId as any).name) {
              plainTask.projectId = String((task.projectId as any)._id);
              plainTask.project = {
                  id: String((task.projectId as any)._id),
                  name: (task.projectId as any).name,
              };
          } else if (mongoose.Types.ObjectId.isValid(task.projectId)) {
              plainTask.projectId = String(task.projectId);
              plainTask.project = undefined;
          } else { // Fallback if projectId is not valid ObjectId string (shouldn't happen with proper DB)
              plainTask.projectId = undefined;
              plainTask.project = undefined;
          }
        } else {
            plainTask.projectId = undefined;
            plainTask.project = undefined;
        }

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