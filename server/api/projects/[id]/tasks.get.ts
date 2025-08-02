// server/api/projects/[id]/tasks.get.ts
import { TaskModel } from '~/server/db/models/task.ts';

export default defineEventHandler(async (event) => {
  const projectId = event.context.params.id;
  const tasks = await TaskModel.find({ projectId });
  return tasks;
});
