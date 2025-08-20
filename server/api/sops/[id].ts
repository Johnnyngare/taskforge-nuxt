// server/api/sops/[id].ts
import { SopModel } from '~/server/db/models/sop';
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
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
    const sop = await SopModel.findById(sopId).populate('authorId', 'name');
    if (!sop) {
      throw createError({ statusCode: 404, message: 'SOP not found' });
    }
    return sop.toJSON();
  }

  // --- RBAC for Write Operations ---
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  // --- HANDLE PUT/UPDATE REQUEST ---
  if (event.node.req.method === 'PUT') {
    const body = await readBody(event);
    const { title, content, category, tags } = body;

    const updatedSop = await SopModel.findByIdAndUpdate(
      sopId,
      { title, content, category, tags },
      { new: true, runValidators: true } // {new: true} returns the updated document
    ).populate('authorId', 'name');

    if (!updatedSop) {
      throw createError({ statusCode: 404, message: 'SOP not found' });
    }
    return updatedSop.toJSON();
  }

  // --- HANDLE DELETE REQUEST ---
  if (event.node.req.method === 'DELETE') {
    const deletedSop = await SopModel.findByIdAndDelete(sopId);
    if (!deletedSop) {
      throw createError({ statusCode: 404, message: 'SOP not found' });
    }
    event.node.res.statusCode = 204; // No Content
    return;
  }

  // If another method is used
  throw createError({ statusCode: 405, message: 'Method Not Allowed' });
});