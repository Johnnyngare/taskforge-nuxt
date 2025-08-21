// server/api/sops/index.post.ts
import { defineEventHandler, createError, readBody } from '#imports';
import { SopModel } from '~/server/db/models/sop';
import { UserRole } from '~/types/user';
import type { H3Event } from 'h3';
import { readMultipartFormData } from 'h3';
import {
  uploadFile,
  ensureUploadsDir,
  renameFile,
  SOP_ATTACHMENTS_SUBDIR,
  UPLOADS_DIR,
  deleteFile
} from "~/server/utils/storage";
import { z } from 'zod';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// --- THE FIX: Corrected Zod Schema for incoming text data ---
const sopTextSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content is required.'),
  category: z.string().min(1, 'Category is required.'),
  // Tags should now expect an array of strings, as that's what is being JSON.stringify'd on the frontend
  tags: z.array(z.string()).optional().default([]), // <--- CRITICAL FIX for 'tags'
}).strict();

// File Validation Constants
const MAX_TOTAL_ATTACHMENTS_PER_SOP = 5;
const MAX_SINGLE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user;

  if (!user || ![UserRole.Admin, UserRole.Manager, UserRole.Dispatcher].includes(user.role as UserRole)) {
    throw createError({ statusCode: 403, message: 'Forbidden: Your role does not permit creating SOPs.' });
  }

  const formData = await readMultipartFormData(event);
  if (!formData) { throw createError({ statusCode: 400, message: "No form data received." }); }

  // --- 1. Parse and Validate Text Fields ---
  const dataField = formData.find(field => field.name === 'data');
  if (!dataField || !dataField.data) { throw createError({ statusCode: 400, message: "SOP text data is missing." }); }
  let parsedTextData: any;
  try { parsedTextData = JSON.parse(dataField.data.toString('utf8')); }
  catch (parseError) { throw createError({ statusCode: 400, message: "Invalid SOP text data format (must be valid JSON)." }); }

  const validationResult = sopTextSchema.safeParse(parsedTextData);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed: " + validationResult.error.errors.map(e => e.message).join(', '),
      data: validationResult.error.format()
    });
  }
  const { title, content, category, tags } = validationResult.data; // tags is now guaranteed to be an array

  // --- 2. Handle Temporary File Uploads & Validate ---
  const newAttachmentFiles = formData.filter(field => field.name === 'attachments' && field.data && field.filename);
  const tempAttachmentsMetadata = [];
  const tempFilePaths: string[] = [];

  if (newAttachmentFiles.length > MAX_TOTAL_ATTACHMENTS_PER_SOP) { throw createError({ statusCode: 400, message: `Max ${MAX_TOTAL_ATTACHMENTS_PER_SOP} attachments allowed.` }); }

  await ensureUploadsDir();

  const tempUploadFolderId = `temp_${uuidv4()}`;

  for (const file of newAttachmentFiles) {
    if (!file.filename || !file.type || !file.data) { throw createError({ statusCode: 400, message: `Invalid file provided: ${file.filename || 'unknown'}.` }); }
    if (file.data.length > MAX_SINGLE_FILE_SIZE_BYTES) { throw createError({ statusCode: 400, message: `File '${file.filename}' exceeds ${MAX_SINGLE_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` }); }
    if (!ALLOWED_MIMES.includes(file.type)) { throw createError({ statusCode: 400, message: `File type '${file.type}' for '${file.filename}' is not allowed.` }); }

    try {
      const { storedName, filePath, publicUrl } = await uploadFile(file.data, file.filename, tempUploadFolderId);
      tempFilePaths.push(filePath);

      tempAttachmentsMetadata.push({
        id: uuidv4(),
        originalName: file.filename,
        storedName: storedName,
        mimeType: file.type,
        size: file.data.length,
        path: path.join(SOP_ATTACHMENTS_SUBDIR, tempUploadFolderId, storedName),
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: { id: user.id, name: user.name || 'Unknown' }, // Use user.name directly
      });
    } catch (uploadError) {
      console.error(`[API POST /sops] Error uploading file '${file.filename}':`, uploadError);
      await Promise.all(tempFilePaths.map(p => deleteFile(p).catch(e => console.error('Cleanup error:', e))));
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
      tags, // tags is already an array from Zod
      authorId: user.id,
      attachments: tempAttachmentsMetadata,
    });
  } catch (dbError: any) {
    console.error(`[API POST /sops] Database error creating SOP:`, dbError);
    await Promise.all(tempFilePaths.map(p => deleteFile(p).catch(e => console.error('Cleanup error:', e))));
    if (dbError.name === 'ValidationError') {
      throw createError({ statusCode: 400, message: dbError.message, data: dbError.errors });
    }
    throw createError({ statusCode: 500, message: `Failed to create SOP due to database issue: ${dbError.message || dbError}.` });
  }

  // --- 4. Move Files to Permanent Location & Update DB References ---
  const finalSopId = newSopDoc._id.toString();
  const updatedAttachments = [];

  for (const att of newSopDoc.attachments) {
    const oldRelativePath = att.path;
    const newRelativePath = path.join(SOP_ATTACHMENTS_SUBDIR, finalSopId, att.storedName);
    const publicUrl = `${process.env.UPLOADS_BASE_URL}/${newRelativePath}`;

    try {
      await renameFile(
        path.join(process.cwd(), UPLOADS_DIR, oldRelativePath),
        path.join(process.cwd(), UPLOADS_DIR, newRelativePath)
      );
      updatedAttachments.push({
        ...att.toJSON(), // Convert subdoc to plain object
        path: newRelativePath,
        url: publicUrl
      });
    } catch (moveError: any) {
      console.error(`[API POST /sops] Failed to move file '${att.originalName}' to permanent SOP folder ${finalSopId}:`, moveError);
    }
  }
  await SopModel.findByIdAndUpdate(newSopDoc._id, { attachments: updatedAttachments });

  event.node.res.statusCode = 201;
  const finalSop = await SopModel.findById(newSopDoc._id).lean();
  return new SopModel(finalSop).toJSON();
});