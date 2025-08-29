// server/api/users/index.get.ts (NEW FILE)
import { defineEventHandler, createError, getQuery } from 'h3';
import { UserModel, UserRole } from '~/server/db/models/user';
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user; // User from your auth middleware

  if (!currentUser || !currentUser.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // RBAC: Only Admin, Manager, Dispatcher can view user lists.
  if (![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(currentUser.role as UserRole)) {
    throw createError({ statusCode: 403, message: 'Forbidden: Your role does not permit viewing this resource.' });
  }

  const query = getQuery(event) as { role?: string };
  const findFilter: any = {};

  if (query.role && Object.values(UserRole).includes(query.role as UserRole)) {
    findFilter.role = query.role;
  }
  
  try {
    const users = await UserModel.find(findFilter)
      .select('name email role profilePhoto') // Select only non-sensitive fields needed for UI
      .lean();

    // Convert to plain JSON objects and ensure id is a string
    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
    }));

  } catch (error: any) {
    console.error('[API GET /users] Error fetching users:', error);
    throw createError({ statusCode: 500, message: 'Failed to fetch users.' });
  }
});