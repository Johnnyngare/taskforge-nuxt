// server/api/sops/index.post.ts
import { defineEventHandler, createError, readBody } from '#imports';
import { SopModel } from '~/server/db/models/sop';
import { UserRole } from '~/types/user';
import type { H3Event } from 'h3';
import { readMultipartFormData } from 'h3';
import { put, del } from '@vercel/blob';
import { z } from 'zod';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Zod Schemas for incoming text data
const sopTextSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content is required.'),
  category: z.string().min(1, 'Category is required.'),
  tags: z.array(z.string()).optional().default([]),
}).strict();

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
  const user = event.context.user;

  if (!user || ![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole)) {
    throw createError({ statusCode: 403, message: 'Forbidden: Your role does not permit creating SOPs.' });
  }

  const formData = await readMultipartFormData(event);
  if (!formData) { 
    throw createError({ statusCode: 400, message: "No form data received." }); 
  }

  // --- 1. Parse and Validate Text Fields ---
  const dataField = formData.find(field => field.name === 'data');
  if (!dataField || !dataField.data) { 
    throw createError({ statusCode: 400, message: "SOP text data is missing." }); 
  }
  
  let parsedTextData: any;
  try { 
    parsedTextData = JSON.parse(dataField.data.toString('utf8')); 
  } catch (parseError) { 
    throw createError({ statusCode: 400, message: "Invalid SOP text data format (must be valid JSON)." }); 
  }

  const validationResult = sopTextSchema.safeParse(parsedTextData);
  if (!validationResult.success) {
    throw createError({ 
      statusCode: 400, 
      message: "Validation failed: " + validationResult.error.errors.map(e => e.message).join(', '), 
      data: validationResult.error.format() 
    });
  }
  const { title, content, category, tags } = validationResult.data;

  // --- 2. Handle File Uploads & Validate ---
  const newAttachmentFiles = formData.filter(field => field.name === 'attachments' && field.data && field.filename);
  const attachmentsMetadata = [];
  const uploadedBlobUrls: string[] = [];

  if (newAttachmentFiles.length > MAX_TOTAL_ATTACHMENTS_PER_SOP) { 
    throw createError({ statusCode: 400, message: `Max ${MAX_TOTAL_ATTACHMENTS_PER_SOP} attachments allowed.` }); 
  }

  // Generate temporary folder ID for initial uploads
  const tempUploadFolderId = `temp_${uuidv4()}`;

  for (const file of newAttachmentFiles) {
    if (!file.filename || !file.type || !file.data) { 
      throw createError({ statusCode: 400, message: `Invalid file provided: ${file.filename || 'unknown'}.` }); 
    }
    if (file.data.length > MAX_SINGLE_FILE_SIZE_BYTES) { 
      throw createError({ statusCode: 400, message: `File '${file.filename}' exceeds ${MAX_SINGLE_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` }); 
    }
    if (!ALLOWED_MIMES.includes(file.type)) { 
      throw createError({ statusCode: 400, message: `File type '${file.type}' for '${file.filename}' is not allowed.` }); 
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

      attachmentsMetadata.push({
        id: uuidv4(),
        originalName: file.filename,
        storedName: storedName,
        mimeType: file.type,
        size: file.data.length,
        blobUrl: blob.url, // Store the temporary blob URL
        url: blob.url, // Public URL is the same as blob URL
        uploadedAt: new Date().toISOString(),
        uploadedBy: { id: user.id, name: user.name || 'Unknown' },
      });
    } catch (uploadError) {
      console.error(`[API POST /sops] Error uploading file '${file.filename}':`, uploadError);
      // Cleanup uploaded blobs
      await Promise.all(uploadedBlobUrls.map(url => 
        del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(e => console.error('Cleanup error:', e))
      ));
      throw createError({ statusCode: 500, message: `Failed to upload file '${file.filename}'.` });
    }
  }

  // --- 3. Create SOP Document in MongoDB ---
  let newSopDoc;
  try {
    newSopDoc = await SopModel.create({
      title,
      content,
      category,
      tags,
      authorId: user.id,
      attachments: attachmentsMetadata,
    });
  } catch (dbError: any) {
    console.error(`[API POST /sops] Database error creating SOP:`, dbError);
    // Cleanup uploaded blobs
    await Promise.all(uploadedBlobUrls.map(url => 
      del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(e => console.error('Cleanup error:', e))
    ));
    if (dbError.name === 'ValidationError') { 
      throw createError({ statusCode: 400, message: dbError.message, data: dbError.errors }); 
    }
    throw createError({ statusCode: 500, message: `Failed to create SOP due to database issue: ${dbError.message || dbError}.` });
  }

  // --- 4. Move Files to Permanent Location in Blob Storage ---
  const finalSopId = newSopDoc._id.toString();
  const updatedAttachments = [];

  for (const att of newSopDoc.attachments) {
    const oldBlobUrl = att.blobUrl;
    const newBlobPath = `sops/${finalSopId}/${att.storedName}`;

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

      updatedAttachments.push({
        id: att.id,
        originalName: att.originalName,
        storedName: att.storedName,
        mimeType: att.mimeType,
        size: att.size,
        blobUrl: permanentBlob.url,
        url: permanentBlob.url,
        uploadedAt: att.uploadedAt,
        uploadedBy: att.uploadedBy,
      });
    } catch (moveError: any) {
      console.error(`[API POST /sops] Failed to move file '${att.originalName}' to permanent location:`, moveError);
      // Keep the temporary location if move fails
      updatedAttachments.push(att);
    }
  }

  // Update the SOP with the new blob URLs
  await SopModel.findByIdAndUpdate(newSopDoc._id, { attachments: updatedAttachments });

  event.node.res.statusCode = 201;
  const finalSop = await SopModel.findById(newSopDoc._id).lean();
  return new SopModel(finalSop).toJSON();
});