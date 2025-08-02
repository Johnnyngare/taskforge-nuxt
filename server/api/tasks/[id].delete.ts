import { TaskModel } from '~/server/db/models/task.ts';
export default defineEventHandler(async (event) => {
  const taskId = event.context.params.id;
  await TaskModel.findByIdAndDelete(taskId);
  return { message: 'Task deleted successfully' };
});