// server/api/sops/[id]/attachments/[attachmentId].get.ts
import { defineEventHandler, getRouterParam, createError, sendRedirect } from '#imports';
import mongoose from 'mongoose';
import { SopModel } from '~/server/db/models/sop';
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
    throw createError({ statusCode: 404, message: 'Attachment not found' }); 
  }

  // --- RBAC for Download: Any authenticated user who can view the SOP can download its attachment ---
  // For stricter access control, uncomment the lines below:
  // if (![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole) && 
  //     String(sop.authorId) !== String(user.id)) {
  //    throw createError({ statusCode: 403, message: 'Forbidden: You do not have permission to download this attachment.' });
  // }

  try {
    // For Vercel Blob, we can either:
    // 1. Redirect to the blob URL (simpler, direct download from Vercel)
    // 2. Proxy the file through our API (more control, but uses server resources)
    
    // Option 1: Direct redirect to Vercel Blob URL (recommended for better performance)
    if (attachment.blobUrl) {
      return sendRedirect(event, attachment.blobUrl, 302);
    }

    // Fallback if blobUrl is missing
    throw createError({ statusCode: 404, message: 'File URL not found.' });

    /* Option 2: Proxy through API (uncomment if you need server-side control over downloads)
    if (attachment.blobUrl) {
      const response = await fetch(attachment.blobUrl);
      if (!response.ok) {
        throw createError({ statusCode: 404, message: 'File not found in blob storage.' });
      }

      const fileBuffer = await response.arrayBuffer();
      
      // Set appropriate headers for download
      event.node.res.setHeader('Content-Type', attachment.mimeType);
      event.node.res.setHeader('Content-Length', attachment.size.toString());
      event.node.res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);

      return Buffer.from(fileBuffer);
    }
    */

  } catch (error: any) {
    if (error.statusCode) { throw error; }
    console.error(`[API GET Attachment] Error serving attachment ${attachmentId}:`, error);
    throw createError({ statusCode: 500, message: 'Failed to serve attachment.' });
  }
});