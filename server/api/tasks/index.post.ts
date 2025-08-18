// server/api/tasks/index.post.ts
import { defineEventHandler, readBody, setResponseStatus, createError } from '#imports';
import { z } from "zod";
import mongoose from "mongoose";

import { TaskPriority, TaskStatus } from "~/types/task";
import { TaskModel } from "~/server/db/models/task";
import { ProjectModel } from "~/server/db/models/project";
import { UserModel } from "~/server/db/models/user";

const getEnumValues = <T extends Record<string, string>>(
  enumObject: T
): [T[keyof T], ...T[keyof T][]] => {
  const values = Object.values(enumObject);
  return values as [T[keyof T], ...T[keyof T][]];
};

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(), // Frontend sends string ID
  priority: z.enum(getEnumValues(TaskPriority)).default(TaskPriority.Medium),
  status: z.enum(getEnumValues(TaskStatus)).default(TaskStatus.Pending),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional()
    .nullable(),
  assignedTo: z.array(z.string()).optional(),
  cost: z.number().min(0, "Cost cannot be negative.").optional().nullable(),
});

export default defineEventHandler(async (event) => {
  console.log("[API POST /tasks] --- START Request Processing ---");
  const ctxUser: { id: string; role: string; name?: string; email?: string } | undefined = event.context?.user;
  if (!ctxUser?.id) {
    console.warn("[API POST /tasks] Unauthorized: No user context found.");
    throw createError({
      statusCode: 401,
      message: "Unauthorized: User not authenticated.",
    });
  }

  const userId = new mongoose.Types.ObjectId(ctxUser.id);
  const role = ctxUser.role;

  let rawBody: any;
  try {
    rawBody = await readBody(event);
    console.log("[API POST /tasks] Raw request body:", rawBody);
  } catch (readBodyError) {
    console.error("[API POST /tasks] Error reading request body:", readBodyError);
    throw createError({ statusCode: 400, message: "Invalid request body format." });
  }

  try {
    const validatedData = createTaskSchema.parse(rawBody);

    let targetProjectId: mongoose.Types.ObjectId | undefined; // CRITICAL: Target type is ObjectId
    if (validatedData.projectId) {
      if (!mongoose.Types.ObjectId.isValid(validatedData.projectId)) {
        throw createError({ statusCode: 400, message: "Invalid Project ID format." });
      }
      targetProjectId = new mongoose.Types.ObjectId(validatedData.projectId); // Convert string to ObjectId

      // RBAC: User can only create tasks for projects they own/manage/are members of (if not Admin)
      if (role !== "admin") {
        const project = await ProjectModel.findById(targetProjectId).select('owner members').lean();
        if (!project) { throw createError({ statusCode: 404, message: "Project not found." }); }

        let hasProjectAccess = false;
        if (String(project.owner) === String(userId)) hasProjectAccess = true;
        if (project.members.map(String).includes(String(userId))) hasProjectAccess = true;

        if (!hasProjectAccess && role === "manager") {
            const managerDoc = await UserModel.findById(userId).select('managedProjects').lean();
            if (managerDoc?.managedProjects?.map(String).includes(String(targetProjectId))) { hasProjectAccess = true; }
        }
        if (!hasProjectAccess) {
          console.warn(`Attempted unauthorized task creation in project ${validatedData.projectId}: User ${userId} (Role: ${role})`);
          throw createError({ statusCode: 403, message: "Forbidden: You do not have permission to create tasks in this project." });
        }
      }
    }

    let assignedToUserIds: mongoose.Types.ObjectId[] = [];
    if (validatedData.assignedTo && validatedData.assignedTo.length > 0) {
        for (const assignedId of validatedData.assignedTo) {
            if (!mongoose.Types.ObjectId.isValid(assignedId)) { throw createError({ statusCode: 400, message: `Invalid assignedTo user ID format: ${assignedId}` }); }
            assignedToUserIds.push(new mongoose.Types.ObjectId(assignedId));
        }
    }

    const taskToCreate = {
      title: validatedData.title,
      description: validatedData.description || undefined,
      status: validatedData.status,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      projectId: targetProjectId, // Use ObjectId for DB
      userId: userId, // Creator is ObjectId
      assignedTo: assignedToUserIds, // Array of ObjectIds
      cost: validatedData.cost !== undefined ? validatedData.cost : 0,
    };

    const task = await TaskModel.create(taskToCreate);

    setResponseStatus(event, 201);
    return { statusCode: 201, message: "Task created successfully!", task: task.toJSON() };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("tasks.post: Validation failed", error.flatten().fieldErrors);
      throw createError({ statusCode: 400, message: "Validation failed", data: error.flatten().fieldErrors });
    }
    console.error("tasks.post: Error creating task", error);
    throw createError({ statusCode: error.statusCode || 500, message: error.message || "Error creating task." });
  } finally {
    console.log("[API POST /tasks] --- END Request Processing ---");
  }
});