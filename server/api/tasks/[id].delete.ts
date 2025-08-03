import { TaskModel } from '~/server/db/models/task.ts'; // Correct import path

export default defineEventHandler(async (event) => {
  // FIX: Validate taskId to ensure it's a valid ObjectId
  const taskId = event.context.params?.id as string; // Safely access .id and cast

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) { // FIX: Add validation
    event.node.res.statusCode = 400; // Bad Request
    return { error: 'Invalid Task ID provided' };
  }

  try {
    const deletedTask = await TaskModel.findByIdAndDelete(taskId);

    if (!deletedTask) { // FIX: Check if task was found and deleted
      event.node.res.statusCode = 404; // Not Found
      return { error: 'Task not found' };
    }

    event.node.res.statusCode = 200; // Success
    return { message: 'Task deleted successfully', taskId }; // Return the ID for confirmation
  } catch (error: any) { // Catch any unexpected database errors
    console.error('Error deleting task:', error);
    event.node.res.statusCode = 500;
    return { error: 'Internal Server Error', message: error.message };
  }
});