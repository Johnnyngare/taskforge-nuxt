// server/api/sops/[id]/attachments/[attachmentId].get.ts
import { defineEventHandler, getRouterParam, createError } from '#imports';
import mongoose from 'mongoose';
import { SopModel } from '~/server/db/models/sop';
import { getFilePath } from '~/server/utils/storage'; // NEW: Import utility to get file path
import type { H3Event } from 'h3';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { UserRole } from '~/types/user'; // For RBAC

export default defineEventHandler(async (event: H3Event) => {
  const sopId = getRouterParam(event, 'id');
  const attachmentId = getRouterParam(event, 'attachmentId');
  const user = event.context.user;

  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }); }
  if (!sopId || !mongoose.Types.ObjectId.isValid(sopId)) { throw createError({ statusCode: 400, message: 'Invalid SOP ID' }); }
  if (!attachmentId) { throw createError({ statusCode: 400, message: 'Attachment ID is required' }); }

  const sop = await SopModel.findById(sopId).lean();
  if (!sop) { throw createError({ statusCode: 404, message: 'SOP not found' }); }

  const attachment = sop.attachments.find(att => att.id === attachmentId);
  if (!attachment) { throw createError({ statusCode: 404, message: 'Attachment not found' }); }

  // --- RBAC for Download: Any authenticated user who can view the SOP can download its attachment ---
  // If the SOPs are publicly viewable by any authenticated user, this might be simplified.
  // Otherwise, you would check roles/ownership similar to other SOP operations.
  // For now, let's assume if they are authenticated AND can view the SOP (which is typically all authenticated users for GET /sops)
  // For stricter: Check if the user is owner, admin, manager, or dispatcher
  if (![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole) && String(sop.authorId) !== String(user.id)) {
     throw createError({ statusCode: 403, message: 'Forbidden: You do not have permission to download this attachment.' });
  }

  const filePath = path.join(process.cwd(), process.env.UPLOADS_DIR || 'uploads', SOP_ATTACHMENTS_SUBDIR, sopId, attachment.storedName); // Construct full path using storedName
  
  try {
    const fileStats = await fs.stat(filePath);
    if (!fileStats.isFile()) { throw createError({ statusCode: 404, message: 'File not found on disk.' }); }

    // Set appropriate headers for download
    event.node.res.setHeader('Content-Type', attachment.mimeType);
    event.node.res.setHeader('Content-Length', fileStats.size);
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);

    // Stream the file
    const fileStream = await fs.readFile(filePath); // Or createReadStream for large files
    return fileStream;

  } catch (err: any) {
    if (err.code === 'ENOENT') { throw createError({ statusCode: 404, message: 'File not found on disk.' }); }
    console.error(`[API GET Attachment] Error serving file ${filePath}:`, err);
    throw createError({ statusCode: 500, message: 'Failed to serve attachment.' });
  }
});