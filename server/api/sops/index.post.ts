// server/api/sops/index.post.ts
// REMOVED: import { defineEventHandler, readBody, createError } from 'h3';
import { SopModel } from '~/server/db/models/sop';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  // RBAC: Only Admins and Managers can create SOPs
  if (!user || !['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
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
    authorId: user.id,
  });

  event.node.res.statusCode = 201;
  return newSop.toJSON();
});