import { defineEventHandler, getQuery, createError } from "h3";
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import type { ITask } from "~/types/task";

export default defineEventHandler(async (event) => {
  const ctxUser = event.context?.user;

  if (!ctxUser || !ctxUser.id || !ctxUser.role) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const role = ctxUser.role;
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const query = getQuery(event) as Record<string, any>;
  let filter: Record<string, any> = {};
  let andConditions: Record<string, any>[] = [];

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  // Your excellent RBAC logic remains unchanged.
  if (role === "admin") {
    // Admin sees all tasks, no filter needed here.
  } else {
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
    
    const uniqueAccessibleProjectObjectIds = [...new Set(accessibleProjectObjectIds.filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
    
    andConditions.push({
      $or: [
        { userId: userId },
        { assignedTo: userId },
        { projectId: { $in: uniqueAccessibleProjectObjectIds } } 
      ],
    });
  }

  if (query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(query.projectId)) {
      throw createError({ statusCode: 400, message: "Invalid Project ID format." });
    }
    const queryProjectId = new mongoose.Types.ObjectId(query.projectId);
    andConditions.push({ projectId: queryProjectId });
  }

  if (andConditions.length > 0) {
    filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
  }

  try {
    // The query itself is correct and fetches all fields from the DB.
    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('projectId', 'name')
      .lean();

    // --- THE FIX IS HERE ---
    // We must add the new `taskType` and `location` fields to the
    // manually constructed `plainTask` object.
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
            // --- NEWLY ADDED FIELDS ---
            taskType: task.taskType, // Add the taskType field
            location: task.location, // Add the location object (will be undefined if not present)
        };
        
        // Your project population logic is correct and remains unchanged.
        if (task.projectId) {
          if (typeof task.projectId === 'object' && (task.projectId as any).name) {
              plainTask.projectId = String((task.projectId as any)._id);
              plainTask.project = {
                  id: String((task.projectId as any)._id),
                  name: (task.projectId as any).name,
              };
          } else if (mongoose.Types.ObjectId.isValid(task.projectId)) {
              plainTask.projectId = String(task.projectId);
          }
        }

        return plainTask;
    });

    return {
      statusCode: 200,
      message: "Tasks retrieved successfully",
      tasks: transformedTasks,
    };
  } catch (err: any) {
    console.error("[API GET /tasks] DB query error:", err);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch tasks due to a database error.",
    });
  }
});