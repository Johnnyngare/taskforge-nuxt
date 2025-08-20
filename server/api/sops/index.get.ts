// server/api/sops/index.get.ts
import { SopModel } from '~/server/db/models/sop';
import type { H3Event } from 'h3'; // NEW: Import H3Event for explicit typing

export default defineEventHandler(async (event: H3Event) => { // ADDED: Explicitly type 'event'
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const sops = await SopModel.find({})
    .populate('authorId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return sops.map(sop => new SopModel(sop).toJSON());
});