// server/api/sops/index.post.ts
import { SopModel } from '~/server/db/models/sop';
import { UserRole } from '~/types/user'; // Assuming UserRole enum is defined here
import type { H3Event } from 'h3'; // For explicit typing of event

export default defineEventHandler(async (event: H3Event) => { // Explicitly type 'event'
  const user = event.context.user;

  // --- THE FIX IS HERE ---
  // RBAC: Explicitly allow 'dispatcher' role (or any other roles) to create SOPs.
  if (!user || ![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole)) { // Cast user.role for type safety
    throw createError({ statusCode: 403, message: 'Forbidden: Your role does not permit creating SOPs.' });
  }

  const body = await readBody(event);
  const { title, content, category, tags } = body;

  if (!title || !content || !category) {
    throw createError({
      statusCode: 400,
      message: 'Title, content, and category are required',
    });
  }

  const newSop = await SopModel.create({
    title,
    content,
    category,
    tags: tags || [],
    authorId: user.id, // Assign the current user as the author
  });

  event.node.res.statusCode = 201; // Set 201 Created status
  return newSop.toJSON(); // Return the created SOP
});