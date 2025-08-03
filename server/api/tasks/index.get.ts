// server/api/tasks/index.get.ts
import { TaskModel } from "~/server/db/models/task.ts";
import mongoose from "mongoose"; // Needed for ObjectId conversion

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filter: { status?: string; projectId?: mongoose.Types.ObjectId } = {}; // FIX: Make projectId Type.ObjectId

  if (query.status) {
    filter.status = query.status as "pending" | "completed";
  }
  // FIX: Convert projectId string from query to ObjectId for filtering
  if (query.projectId) {
    // Only apply filter if it's a valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(query.projectId as string)) {
      filter.projectId = new mongoose.Types.ObjectId(query.projectId as string);
    } else {
      // If an invalid projectId is provided, return a 400 error
      event.node.res.statusCode = 400;
      return { error: "Invalid Project ID format in query" };
    }
  }

  try {
    const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });
    return tasks;
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    event.node.res.statusCode = 500;
    return { error: "Internal Server Error", message: error.message };
  }
});
