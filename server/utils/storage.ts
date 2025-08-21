// server/utils/storage.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid'; // v4 is a function, not needed for direct export here

// Configuration for file storage
export const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
export const SOP_ATTACHMENTS_SUBDIR = 'sops'; // Used for SOP-specific subdirectories
const BASE_URL_PUBLIC = process.env.UPLOADS_BASE_URL || 'http://localhost:3000/uploads'; // Correctly use UPLOADS_BASE_URL for public URL

// Ensure the necessary directories exist on server startup
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

// Saves a buffer (file data) to disk
export const uploadFile = async ( // Changed name from saveFileToDisk to uploadFile for direct export
  fileBuffer: Buffer,
  originalName: string,
  targetFolderId: string // Renamed targetSopId to targetFolderId for clarity (can be temp or actual SOP ID)
): Promise<UploadFileResult> => {
  const fileExtension = path.extname(originalName);
  const storedName = `${uuidv4()}${fileExtension}`; // Use uuidv4() here directly
  const specificDir = path.join(process.cwd(), UPLOADS_DIR, SOP_ATTACHMENTS_SUBDIR, targetFolderId);
  const filePath = path.join(specificDir, storedName);

  await fs.mkdir(specificDir, { recursive: true });
  await fs.writeFile(filePath, fileBuffer);

  const publicUrl = `${BASE_URL_PUBLIC}/${SOP_ATTACHMENTS_SUBDIR}/${targetFolderId}/${storedName}`;

  return { storedName, filePath, publicUrl };
};

// Deletes a file from disk
export const deleteFile = async (filePath: string): Promise<void> => { // Changed name from deleteFileFromDisk to deleteFile for direct export
  try {
    await fs.unlink(filePath);
    console.log(`[Storage] Deleted file from disk: ${filePath}`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[Storage] Attempted to delete non-existent file: ${filePath}`);
      return; // File already gone, treat as success
    }
    console.error(`[Storage] Failed to delete file ${filePath}:`, error);
    throw error;
  }
};

// --- NEW: Export renameFile function ---
export const renameFile = async (oldPath: string, newPath: string): Promise<void> => {
  try {
    await fs.rename(oldPath, newPath);
    console.log(`[Storage] Renamed file from ${oldPath} to ${newPath}`);
  } catch (error) {
    console.error(`[Storage] Failed to rename file from ${oldPath} to ${newPath}:`, error);
    throw error;
  }
};

// Helper to construct file path from stored metadata
// No change to this helper's export
export const getFilePath = (storedName: string, sopId: string) => {
  return path.join(process.cwd(), UPLOADS_DIR, SOP_ATTACHMENTS_SUBDIR, sopId, storedName);
};