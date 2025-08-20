// server/api/projects/index.get.ts
//import { defineEventHandler, createError } from "h3";
import mongoose from "mongoose";
import { ProjectModel } from "~/server/db/models/project";

export default defineEventHandler(async (event) => {
  const ctxUser = event.context?.user;
  if (!ctxUser?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const filter = buildProjectFilter(ctxUser);

  try {
    const projects = await ProjectModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // THE FIX: Return the array of projects directly.
    return projects.map(project => new ProjectModel(project).toJSON());

  } catch (err: any) {
    console.error("[API GET /projects] DB query error:", err);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch projects due to a database error.",
    });
  }
});

// Helper function
const buildProjectFilter = (ctxUser: any) => {
  let filter: Record<string, any> = {};
  if (ctxUser.role !== 'admin') {
    const userId = new mongoose.Types.ObjectId(ctxUser.id);
    filter = {
      $or: [
        { owner: userId },
        { members: userId },
      ],
    };
  }
  return filter;
};