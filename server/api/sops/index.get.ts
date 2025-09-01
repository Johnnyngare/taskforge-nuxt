// server/api/sops/index.get.ts - UPDATED for more robust author transformation
import { SopModel } from '~/server/db/models/sop';
import type { H3Event } from 'h3';
import { UserRole } from '~/types/user';

export default defineEventHandler(async (event: H3Event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const currentUser = event.context.user;

  const query: mongoose.FilterQuery<typeof SopModel> = {};

  query.$or = [
    { authorId: currentUser.id },
    { isGlobal: true }
  ];

  const sops = await SopModel.find(query)
    .populate('authorId', 'name') // Ensure authorId is populated
    .sort({ createdAt: -1 })
    .lean();

  return sops.map(sop => {
    const transformedSop: any = {
      ...sop,
      id: sop._id.toString(),
    };
    delete transformedSop._id;
    delete transformedSop.__v;

    // Robust author transformation
    if (sop.authorId && typeof sop.authorId === 'object') {
      // If authorId was populated into an object
      transformedSop.author = {
        id: (sop.authorId as any)._id?.toString() || (sop.authorId as any).id,
        name: (sop.authorId as any).name || 'Unknown User' // Ensure name is always a string
      };
    } else if (sop.authorId) {
      // If authorId exists but wasn't populated (e.g., just an ID string)
      transformedSop.author = { id: sop.authorId.toString(), name: 'Unknown User' };
    } else {
      // If authorId is entirely missing or null
      transformedSop.author = { id: 'unknown', name: 'Unknown User' }; // Provide a default "unknown" author object
    }
    delete transformedSop.authorId; // Remove original authorId field

    return transformedSop;
  });
});