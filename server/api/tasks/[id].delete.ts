// server/api/tasks/[id].delete.ts
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project";
import { UserRole } from "~/types/user";
import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => { // Type 'event'
  const taskId = getRouterParam(event, 'id');

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({ statusCode: 400, message: "Invalid Task ID provided." });
  }

  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const role: UserRole = ctxUser.role as UserRole; // Explicitly cast role

  const taskToDelete = await TaskModel.findById(taskId);

  if (!taskToDelete) {
    throw createError({ statusCode: 404, message: "Task not found." });
  }

  // --- REVISED RBAC for DELETE (Comprehensive & Handles 'dispatcher' properly) ---
  let canDelete = false;
  if (role === UserRole.Admin) { // Admins can always delete
    canDelete = true;
  } else if (taskToDelete.userId.equals(userId)) { // Task owner can delete
    canDelete = true;
  } else if ([UserRole.Manager, UserRole.Dispatcher].includes(role)) {
    // Managers/Dispatchers can delete tasks if they manage the project associated with the task
    if (taskToDelete.projectId) {
      const project = await ProjectModel.findById(taskToDelete.projectId).select('owner members').lean();
      if (project) {
        // If manager/dispatcher is project owner or member (direct project involvement)
        if (project.owner.equals(userId) || project.members?.some(memberId => memberId.equals(userId))) {
          canDelete = true;
        } else {
          // Check if manager/dispatcher manages this specific project (assuming UserModel has 'managedProjects')
          const managerUser = await UserModel.findById(userId).select('managedProjects').lean();
          if (managerUser?.managedProjects?.some((mpId: mongoose.Types.ObjectId) => mpId.equals(taskToDelete.projectId))) {
            canDelete = true;
          }
        }
      }
    }
  }

  if (!canDelete) {
    console.warn(`Attempted unauthorized task deletion: User ${userId} (Role: ${role}) tried to delete Task ${taskId} owned by ${taskToDelete.userId}.`);
    throw createError({ statusCode: 403, message: "Forbidden: You do not have permission to delete this task." });
  }

  try {
    const deletedTask = await TaskModel.findByIdAndDelete(taskId);

    if (!deletedTask) { // Should not happen if task was found earlier
      throw createError({ statusCode: 404, message: "Task not found after deletion attempt." });
    }

    event.node.res.statusCode = 204; // Return 204 No Content for successful deletion
    return; // No body for 204
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    console.error("Error deleting task in DB:", error);
    throw createError({ statusCode: 500, message: "An unexpected error occurred while deleting the task." });
  }
});