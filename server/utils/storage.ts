// server/utils/storage.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

// Configuration for file storage
export const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
export const SOP_ATTACHMENTS_SUBDIR = 'sops';
const BASE_URL_PUBLIC = process.env.UPLOADS_BASE_URL || 'http://localhost:3000/uploads';

export const ensureUploadsDir = async () => {
  const fullUploadsDirPath = path.join(process.cwd(), UPLOADS_DIR);
  const fullSopAttachmentsDirPath = path.join(fullUploadsDirPath, SOP_ATTACHMENTS_SUBDIR);

  try {
    await fs.mkdir(fullUploadsDirPath, { recursive: true });
    await fs.mkdir(fullSopAttachmentsDirPath, { recursive: true });
    console.log(`[Storage] Ensured upload directories exist: ${fullSopAttachmentsDirPath}`);
  } catch (error) {
    console.error(`[Storage] Failed to create upload directories:`, error);
    throw error;
  }
};

interface UploadFileResult {
  storedName: string;
  filePath: string; // Full absolute path on disk
  publicUrl: string; // URL accessible by client
}

export const uploadFile = async (
  fileBuffer: Buffer,
  originalName: string,
  targetFolderId: string
): Promise<UploadFileResult> => {
  const fileExtension = path.extname(originalName);
  const storedName = `${uuidv4()}${fileExtension}`;
  const specificDir = path.join(process.cwd(), UPLOADS_DIR, SOP_ATTACHMENTS_SUBDIR, targetFolderId);
  const filePath = path.join(specificDir, storedName);

  await fs.mkdir(specificDir, { recursive: true });
  await fs.writeFile(filePath, fileBuffer);
  console.log(`[Storage] File uploaded to temp path: ${filePath}`); // NEW: Log successful temp upload

  const publicUrl = `${BASE_URL_PUBLIC}/${SOP_ATTACHMENTS_SUBDIR}/${targetFolderId}/${storedName}`;

  return { storedName, filePath, publicUrl };
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
    console.log(`[Storage] Deleted file from disk: ${filePath}`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[Storage] Attempted to delete non-existent file: ${filePath}`);
      return;
    }
    console.error(`[Storage] Failed to delete file ${filePath}:`, error);
    throw error;
  }
};

// --- NEW/UPDATED: Robust renameFile function ---
export const renameFile = async (oldPath: string, newPath: string): Promise<void> => {
  const resolvedOldPath = path.resolve(oldPath); // Resolve to absolute path
  const resolvedNewPath = path.resolve(newPath); // Resolve to absolute path
  const newDirPath = path.dirname(resolvedNewPath);

  console.log(`[Storage/Rename] Attempting to rename/move:`); // NEW: Debug log
  console.log(`[Storage/Rename]   Old: ${resolvedOldPath}`); // NEW: Debug log
  console.log(`[Storage/Rename]   New: ${resolvedNewPath}`); // NEW: Debug log

  try {
    // Verify source file exists before attempting rename
    await fs.access(resolvedOldPath, fs.constants.F_OK);
    console.log(`[Storage/Rename] Source file confirmed EXISTS at ${resolvedOldPath}.`); // NEW: Debug log

    await fs.mkdir(newDirPath, { recursive: true }); // Ensure destination directory exists
    await fs.rename(resolvedOldPath, resolvedNewPath);
    console.log(`[Storage] Renamed file from ${resolvedOldPath} to ${resolvedNewPath}`);
  } catch (error: any) {
    console.error(`[Storage/Rename] CRITICAL ERROR: Failed to rename file:`, error);
    // Add specific checks for ENOENT for better context in logs
    if (error.code === 'ENOENT') {
      console.error(`[Storage/Rename] Root Cause: ENOENT - File '${resolvedOldPath}' DOES NOT EXIST or destination directory '${newDirPath}' IS NOT FOUND.`);
    }
    throw error; // Re-throw the error to be caught by the API handler
  }
};

export const getFilePath = (storedName: string, sopId: string) => {
  return path.join(process.cwd(), UPLOADS_DIR, SOP_ATTACHMENTS_SUBDIR, sopId, storedName);
};