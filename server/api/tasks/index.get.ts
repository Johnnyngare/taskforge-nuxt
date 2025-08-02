// server/api/tasks/index.get.ts
import { TaskModel } from '~/server/db/models/task.ts'; // Changed to 'db/models/task.ts'

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filter: { status?: string; projectId?: string } = {}; // Add type for filter
  if (query.status) {
    filter.status = query.status as 'pending' | 'completed'; // Cast if types are strict
  }
  if (query.projectId) {
    filter.projectId = query.projectId as string; // Assuming projectId is string initially
  }

  const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });
  return tasks;
});