// server/api/sops/[id]/attachments/[attachmentId].delete.ts
import { defineEventHandler, getRouterParam, createError } from '#imports';
import mongoose from 'mongoose';
import { SopModel } from '~/server/db/models/sop';
import { del } from '@vercel/blob';
import type { H3Event } from 'h3';
import { UserRole } from '~/types/user';

export default defineEventHandler(async (event: H3Event) => {
  const sopId = getRouterParam(event, 'id');
  const attachmentId = getRouterParam(event, 'attachmentId');
  const user = event.context.user;

  if (!user) { 
    throw createError({ statusCode: 401, message: 'Unauthorized' }); 
  }
  if (!sopId || !mongoose.Types.ObjectId.isValid(sopId)) { 
    throw createError({ statusCode: 400, message: 'Invalid SOP ID' }); 
  }
  if (!attachmentId) { 
    throw createError({ statusCode: 400, message: 'Attachment ID is required' }); 
  }

  const sop = await SopModel.findById(sopId).lean();
  if (!sop) { 
    throw createError({ statusCode: 404, message: 'SOP not found' }); 
  }

  const attachment = sop.attachments.find(att => att.id === attachmentId);
  if (!attachment) { 
    throw createError({ statusCode: 404, message: 'Attachment not found on SOP.' }); 
  }

  // --- RBAC for Attachment Deletion ---
  // Only Admin, Manager, Dispatcher, OR the SOP's author can delete an attachment.
  if (![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole) && 
      String(sop.authorId) !== String(user.id)) {
     throw createError({ 
       statusCode: 403, 
       message: 'Forbidden: You do not have permission to delete this attachment.' 
     });
  }

  try {
    // 1. Delete file from Vercel Blob
    if (attachment.blobUrl) {
      await del(attachment.blobUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log(`[API DELETE Attachment] Deleted file from Vercel Blob: ${attachment.blobUrl}`);
    }

    // 2. Remove attachment metadata from SOP document in DB
    const updatedSop = await SopModel.findByIdAndUpdate(
      sopId,
      { $pull: { attachments: { id: attachmentId } } }, // $pull operator removes element from array
      { new: true } // Return updated document
    ).lean();

    if (!updatedSop) { 
      throw createError({ statusCode: 404, message: 'SOP not found after attachment removal.' }); 
    }

    event.node.res.statusCode = 204; // No Content for successful deletion
    return;
  } catch (error: any) {
    if (error.statusCode) { throw error; } // Re-throw H3Error
    console.error(`[API DELETE Attachment] Error deleting attachment ${attachmentId} for SOP ${sopId}:`, error);
    throw createError({ statusCode: 500, message: 'Failed to delete attachment.' });
  }
});