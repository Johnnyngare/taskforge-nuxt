// server/api/sops/[id].put.ts
import { defineEventHandler, createError, getRouterParam } from '#imports';
import { SopModel } from '~/server/db/models/sop';
import { UserRole } from '~/types/user';
import type { H3Event } from 'h3';
import mongoose from 'mongoose';
import { readMultipartFormData } from 'h3';
import { put, del } from '@vercel/blob';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Zod Schemas for incoming text data (from multipart)
const sopTextUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required.').optional(),
  content: z.string().min(1, 'Content is required.').optional(),
  category: z.string().min(1, 'Category is required.').optional(),
  tags: z.array(z.string()).optional().default([]),
}).strict();

// Zod Schema for attachmentsToDelete (comes as a stringified JSON array)
const attachmentsToDeleteSchema = z.array(z.string()).optional().default([]);

// File Validation Constants
const MAX_TOTAL_ATTACHMENTS_PER_SOP = 5;
const MAX_SINGLE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = [
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'image/png', 'image/jpeg', 'image/jpg'
];

export default defineEventHandler(async (event: H3Event) => {
  const sopId = getRouterParam(event, 'id');
  const user = event.context.user;

  if (!user) { 
    throw createError({ statusCode: 401, message: 'Unauthorized' }); 
  }
  if (!sopId || !mongoose.Types.ObjectId.isValid(sopId)) { 
    throw createError({ statusCode: 400, message: 'Invalid SOP ID' }); 
  }

  const sopToUpdate = await SopModel.findById(sopId).lean();
  if (!sopToUpdate) { 
    throw createError({ statusCode: 404, message: 'SOP not found' }); 
  }

  // RBAC for Update
  if (![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole)) {
    throw createError({ statusCode: 403, message: 'Forbidden: Your role does not permit updating SOPs.' });
  }

  const formData = await readMultipartFormData(event);
  if (!formData) { 
    throw createError({ statusCode: 400, message: "No form data received." }); 
  }

  // 1. Parse Text Fields and `attachmentsToDelete` Array
  const dataField = formData.find(field => field.name === 'data');
  let parsedTextData: any = {};
  if (dataField && dataField.data) {
    try { 
      parsedTextData = JSON.parse(dataField.data.toString('utf8')); 
    } catch (parseError) { 
      throw createError({ statusCode: 400, message: "Invalid SOP data format." }); 
    }
  }
  
  const validationResult = sopTextUpdateSchema.safeParse(parsedTextData);
  if (!validationResult.success) { 
    throw createError({ 
      statusCode: 400, 
      message: "Validation failed: " + validationResult.error.errors.map(e => e.message).join(', ') 
    }); 
  }
  const { title, content, category, tags } = validationResult.data;

  const attachmentsToDeleteField = formData.find(field => field.name === 'attachmentsToDelete');
  let attachmentIdsToDelete: string[] = [];
  if (attachmentsToDeleteField && attachmentsToDeleteField.data) {
    try { 
      attachmentIdsToDelete = attachmentsToDeleteSchema.parse(
        JSON.parse(attachmentsToDeleteField.data.toString('utf8'))
      ); 
    } catch (parseError) { 
      throw createError({ statusCode: 400, message: "Invalid attachmentsToDelete format." }); 
    }
  }

  // 2. Process Existing Attachments: Filter out those marked for deletion
  let attachmentsToKeep = sopToUpdate.attachments?.filter(att => !attachmentIdsToDelete.includes(att.id)) || [];

  // 3. Handle New File Uploads
  const newAttachmentFiles = formData.filter(field => field.name === 'attachments' && field.data && field.filename);
  const newAttachmentsMetadata = [];
  const uploadedBlobUrls: string[] = [];

  const totalFilesAfterDeletionAndUpload = attachmentsToKeep.length + newAttachmentFiles.length;
  if (totalFilesAfterDeletionAndUpload > MAX_TOTAL_ATTACHMENTS_PER_SOP) {
    throw createError({ 
      statusCode: 400, 
      message: `Max ${MAX_TOTAL_ATTACHMENTS_PER_SOP} attachments allowed. You are adding too many.` 
    });
  }

  const tempUploadFolderId = `temp_update_${uuidv4()}`;

  for (const file of newAttachmentFiles) {
    if (!file.filename || !file.type || !file.data) { 
      throw createError({ statusCode: 400, message: `Invalid file provided: ${file.filename || 'unknown'}.` }); 
    }
    if (file.data.length > MAX_SINGLE_FILE_SIZE_BYTES) { 
      throw createError({ 
        statusCode: 400, 
        message: `File '${file.filename}' exceeds ${MAX_SINGLE_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` 
      }); 
    }
    if (!ALLOWED_MIMES.includes(file.type)) { 
      throw createError({ 
        statusCode: 400, 
        message: `File type '${file.type}' for '${file.filename}' is not allowed.` 
      }); 
    }

    try {
      const fileExtension = file.filename.split('.').pop() || '';
      const storedName = `${uuidv4()}.${fileExtension}`;
      const blobPath = `sops/${tempUploadFolderId}/${storedName}`;

      const blob = await put(blobPath, file.data, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      uploadedBlobUrls.push(blob.url);

      newAttachmentsMetadata.push({
        id: uuidv4(),
        originalName: file.filename,
        storedName: storedName,
        mimeType: file.type,
        size: file.data.length,
        blobUrl: blob.url,
        url: blob.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: { id: user.id, name: user.name || 'Unknown' },
      });
    } catch (uploadError) {
      console.error(`[API PUT /sops] Error uploading new file '${file.filename}':`, uploadError);
      // Cleanup uploaded blobs
      await Promise.all(uploadedBlobUrls.map(url => 
        del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(e => console.error('Cleanup error:', e))
      ));
      throw createError({ statusCode: 500, message: `Failed to upload new file '${file.filename}'.` });
    }
  }

  // 4. Delete files from Vercel Blob that were marked for deletion
  const deletionPromises = attachmentIdsToDelete.map(async (attId) => {
    const att = sopToUpdate.attachments.find(a => a.id === attId);
    if (att && att.blobUrl) {
      try {
        await del(att.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
        console.log(`[API PUT /sops] Deleted attachment ${attId} from Vercel Blob`);
      } catch (error) {
        console.error(`[API PUT /sops] Failed to delete attachment ${attId} from Vercel Blob:`, error);
      }
    } else {
      console.warn(`[API PUT /sops] Attempted to delete attachment with ID ${attId} not found on SOP ${sopId}.`);
    }
  });

  await Promise.all(deletionPromises);

  // 5. Move New Files to Permanent Location
  const updatedNewAttachments = [];
  for (const att of newAttachmentsMetadata) {
    const oldBlobUrl = att.blobUrl;
    const newBlobPath = `sops/${sopId}/${att.storedName}`;

    try {
      // Get the file data from the temporary blob
      const response = await fetch(oldBlobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch temporary blob: ${response.statusText}`);
      }
      const fileBuffer = Buffer.from(await response.arrayBuffer());

      // Upload to permanent location
      const permanentBlob = await put(newBlobPath, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Delete temporary blob
      await del(oldBlobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });

      updatedNewAttachments.push({
        ...att,
        blobUrl: permanentBlob.url,
        url: permanentBlob.url,
      });
    } catch (moveError: any) {
      console.error(`[API PUT /sops] Failed to move new file '${att.originalName}' to permanent location:`, moveError);
      // Keep the temporary location if move fails
      updatedNewAttachments.push(att);
    }
  }

  // 6. Build Final Attachments Array
  const finalAttachments = [...attachmentsToKeep, ...updatedNewAttachments];

  // 7. Update SOP Document in DB
  const updatePayload: Record<string, any> = {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(category !== undefined && { category }),
    ...(tags !== undefined && { tags }),
    attachments: finalAttachments,
  };

  try {
    const updatedSop = await SopModel.findByIdAndUpdate(
      sopId,
      updatePayload,
      { new: true, runValidators: true }
    ).populate('authorId', 'name').lean();

    if (!updatedSop) { 
      throw createError({ statusCode: 404, message: 'SOP not found after update' }); 
    }

    return new SopModel(updatedSop).toJSON();
  } catch (error: any) {
    if (error.statusCode) { throw error; }
    if (error instanceof z.ZodError) { 
      throw createError({ statusCode: 400, message: error.message, data: error.format() }); 
    }
    if (error.name === 'ValidationError') { 
      throw createError({ statusCode: 400, message: error.message, data: error.errors }); 
    }
    throw createError({ 
      statusCode: 500, 
      message: "An unexpected error occurred while updating the SOP.", 
      cause: error 
    });
  }
});