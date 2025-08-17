// server/api/tasks/[id].delete.ts
import mongoose from "mongoose";
import { TaskModel } from "~/server/db/models/task";
import { defineEventHandler, createError } from "h3";
import { UserModel } from "~/server/db/models/user";
import { ProjectModel } from "~/server/db/models/project"; // Import ProjectModel
import { UserRole } from "~/types/user";

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({
      statusCode: 400,
      message: "Invalid Task ID provided.",
    });
  }

  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized: User not authenticated." });
  }
  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const role = ctxUser.role;

  const taskToDelete = await TaskModel.findById(taskId);

  if (!taskToDelete) {
    throw createError({ statusCode: 404, message: "Task not found." });
  }

  // CRITICAL RBAC for DELETE
  let canDelete = false;
  // Admin can delete any task
  if (role === UserRole.Admin) {
    canDelete = true;
  } else if (String(taskToDelete.userId) === String(userId)) {
    // Owner of the task can delete their own task
    canDelete = true;
  } else if (taskToDelete.projectId) {
    // If task is part of a project, check project-based permissions
    const project = await ProjectModel.findById(taskToDelete.projectId).select('owner members').lean();
    if (project) {
      if (String(project.owner) === String(userId) && (role === "manager" || role === "dispatcher")) { // Manager/Dispatcher owns project
        canDelete = true;
      } else if (project.members.map(String).includes(String(userId)) && (role === "manager" || role === "dispatcher")) { // Manager/Dispatcher is a member of project
         canDelete = true;
      } else if (role === UserRole.TeamManager) { // Team Manager can delete tasks in projects they manage
        const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
        const managedProjectIds = managerDoc?.managedProjects?.map((id: string) => String(new mongoose.Types.ObjectId(id))) || [];
        if (managedProjectIds.includes(String(taskToDelete.projectId))) {
          canDelete = true;
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

    if (!deletedTask) {
      throw createError({ statusCode: 404, message: "Task not found." });
    }

    return {
      statusCode: 200, // Return 200 OK for successful deletion
      message: "Task deleted successfully.",
      taskId: taskId, // Confirm the deleted task ID
    };
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    console.error("Error deleting task in DB:", error);
    throw createError({ statusCode: 500, message: "An unexpected error occurred while deleting the task." });
  }
});