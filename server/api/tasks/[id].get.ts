// server/api/tasks/[id].get.ts - CORRECTED
import { defineEventHandler, createError, getRouterParam } from 'h3';
import { TaskModel } from '~/server/db/models/task';
import { UserRole } from '~/types/user';
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user; // From auth middleware

  if (!currentUser || !currentUser.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const taskId = getRouterParam(event, 'id');
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError({ statusCode: 400, message: 'Invalid Task ID' });
  }

  try {
    // Populate 'userId' (the creator), 'assignedTo', and 'projectId'
    // Use .lean() for performance to get plain JavaScript objects
    const task = await TaskModel.findById(taskId)
      .populate('userId', 'name email profilePhoto') // Populates creator into 'userId' field
      .populate('assignedTo', 'name email profilePhoto role')
      .populate('projectId', 'name')
      .lean();

    if (!task) {
      throw createError({ statusCode: 404, message: 'Task not found' });
    }

    // --- RBAC for Viewing a Single Task ---
    // Allow Admin, Manager, Dispatcher, Task Creator, or an Assigned Officer to view
    let hasAccess = false;
    if (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Manager || currentUser.role === UserRole.Dispatcher) {
      hasAccess = true;
    } else if (task.userId && String(task.userId._id || task.userId) === currentUser.id) {
      // Check if current user is the task creator (handles both populated object and potentially unpopulated ID string)
      hasAccess = true;
    } else if (task.assignedTo && task.assignedTo.some((assignedUser: any) => String(assignedUser._id) === currentUser.id)) {
      // Check if current user is an assigned officer
      hasAccess = true;
    }

    if (!hasAccess) {
      throw createError({ statusCode: 403, message: 'Forbidden: You do not have permission to view this task.' });
    }

    // --- Transform the task object for the frontend to use 'id' instead of '_id' and rename 'userId' to 'author' ---
    const transformedTask: any = {
        ...task,
        id: task._id.toString(), // Convert main task _id to id string
    };
    delete transformedTask._id;
    delete transformedTask.__v; // Remove Mongoose internal version key

    // Rename 'userId' (creator) to 'author' to match frontend's expectation, and transform it
    if (transformedTask.userId) {
        const author: any = { ...transformedTask.userId }; // Create a copy of the populated user object
        if (author._id) { // Ensure _id exists before converting
            author.id = author._id.toString();
            delete author._id;
        }
        delete author.__v; // Remove '__v' from populated author object
        transformedTask.author = author; // Assign to 'author'
        delete transformedTask.userId; // Remove the original 'userId' field
    }

    // Transform 'assignedTo' array: ensure each assignee has 'id' and remove '_id', '__v'
    if (transformedTask.assignedTo && Array.isArray(transformedTask.assignedTo)) {
        transformedTask.assignedTo = transformedTask.assignedTo.map((assignee: any) => {
            const transformedAssignee: any = { ...assignee }; // Create a copy
            if (transformedAssignee._id) { // Ensure _id exists before converting
                transformedAssignee.id = transformedAssignee._id.toString();
                delete transformedAssignee._id;
            }
            delete transformedAssignee.__v; // Remove '__v' from populated assignee object
            return transformedAssignee;
        });
    }

    // Transform 'projectId': ensure it has 'id' and remove '_id', '__v'
    if (transformedTask.projectId && transformedTask.projectId._id) {
        transformedTask.projectId.id = transformedTask.projectId._id.toString();
        delete transformedTask.projectId._id;
        delete transformedTask.projectId.__v; // Remove '__v' from populated project object
    }

    return transformedTask; // Return the transformed object

  } catch (error: any) {
    console.error(`[API GET /tasks/${taskId}] Error fetching task:`, error);
    // Use the error's status code if available, otherwise default to 500
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch task details.',
      data: error.data, // Preserve original error data if any
    });
  }
});