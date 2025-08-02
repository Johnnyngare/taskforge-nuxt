import { TaskModel } from '~/server/db/models/task.ts';
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const taskId = event.context.params.id;
  const updatedTask = await TaskModel.findByIdAndUpdate(taskId, body, { new: true });
  return updatedTask;
});