// server/api/sops/index.get.ts
//import { defineEventHandler, createError } from 'h3';
import { SopModel } from '~/server/db/models/sop';

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const sops = await SopModel.find({})
    .populate('authorId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // THE FIX: Return the array of SOPs directly.
  return sops.map(sop => new SopModel(sop).toJSON());
});