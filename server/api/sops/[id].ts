// server/api/sops/[id].ts
import { SopModel } from '~/server/db/models/sop';
import { UserRole } from '~/types/user'; // Ensure UserRole enum is defined here
import type { H3Event } from 'h3'; // For explicit typing of event
import mongoose from 'mongoose';

export default defineEventHandler(async (event: H3Event) => { // Explicitly type 'event'
  const user = event.context.user;
  const sopId = event.context.params?.id;

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  if (!sopId || !mongoose.Types.ObjectId.isValid(sopId)) {
    throw createError({ statusCode: 400, message: 'Invalid SOP ID' });
  }

  // --- HANDLE GET REQUEST ---
  if (event.node.req.method === 'GET') {
    const sop = await SopModel.findById(sopId).populate('authorId', 'name').lean();
    if (!sop) {
      throw createError({ statusCode: 404, message: 'SOP not found' });
    }
    return new SopModel(sop).toJSON(); // Convert lean doc to JSON
  }

  // --- RBAC for Write Operations (PUT/DELETE) ---
  // THE FIX: Use UserRole.Manager directly as it now aligns to "manager"
  // Allow Admins, Managers, AND Dispatchers for PUT/DELETE
  if (!user || ![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole)) {
    throw createError({ statusCode: 403, message: 'Forbidden: Your role does not permit this action for SOPs.' });
  }

  // --- HANDLE PUT/UPDATE REQUEST ---
  if (event.node.req.method === 'PUT') {
    const body = await readBody(event);
    const { title, content, category, tags } = body;

    const updatedSop = await SopModel.findByIdAndUpdate(
      sopId,
      { title, content, category, tags },
      { new: true, runValidators: true } // {new: true} returns the updated document
    ).populate('authorId', 'name').lean();

    if (!updatedSop) {
      throw createError({ statusCode: 404, message: 'SOP not found' });
    }
    return new SopModel(updatedSop).toJSON(); // Convert lean doc to JSON
  }

  // --- HANDLE DELETE REQUEST ---
  if (event.node.req.method === 'DELETE') {
    const deletedSop = await SopModel.findByIdAndDelete(sopId).lean();
    if (!deletedSop) {
      throw createError({ statusCode: 404, message: 'SOP not found' });
    }
    event.node.res.statusCode = 204; // No Content
    return; // Return nothing for 204 status
  }

  // If another method is used
  throw createError({ statusCode: 405, message: 'Method Not Allowed' });
});