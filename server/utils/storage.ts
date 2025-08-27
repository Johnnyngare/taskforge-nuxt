// server/utils/storage.ts
import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

// Configuration for Vercel Blob storage
export const SOP_ATTACHMENTS_SUBDIR = 'sops';

interface UploadFileResult {
  storedName: string;
  blobUrl: string; // Vercel Blob URL
  publicUrl: string; // Same as blobUrl for Vercel Blob
}

export const ensureUploadsDir = async (): Promise<void> => {
  // No-op for Vercel Blob - directories are virtual
  console.log(`[Storage] Using Vercel Blob storage - no directory creation needed`);
};

export const uploadFile = async (
  fileBuffer: Buffer,
  originalName: string,
  targetFolderId: string
): Promise<UploadFileResult> => {
  const fileExtension = originalName.split('.').pop() || '';
  const storedName = `${uuidv4()}.${fileExtension}`;
  const blobPath = `${SOP_ATTACHMENTS_SUBDIR}/${targetFolderId}/${storedName}`;

  try {
    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[Storage] File uploaded to Vercel Blob: ${blob.url}`);

    return {
      storedName,
      blobUrl: blob.url,
      publicUrl: blob.url,
    };
  } catch (error) {
    console.error(`[Storage] Failed to upload file to Vercel Blob:`, error);
    throw error;
  }
};

export const deleteFile = async (blobUrl: string): Promise<void> => {
  try {
    await del(blobUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`[Storage] Deleted file from Vercel Blob: ${blobUrl}`);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      console.warn(`[Storage] Attempted to delete non-existent file: ${blobUrl}`);
      return;
    }
    console.error(`[Storage] Failed to delete file ${blobUrl}:`, error);
    throw error;
  }
};

// For Vercel Blob, renaming is effectively delete + upload
export const renameFile = async (oldBlobUrl: string, newPath: string, fileBuffer: Buffer): Promise<string> => {
  try {
    // Upload to new location
    const blob = await put(newPath, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Delete old file
    await deleteFile(oldBlobUrl);

    console.log(`[Storage] Renamed file from ${oldBlobUrl} to ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`[Storage] Failed to rename file:`, error);
    throw error;
  }
};

// Utility function to get blob path from SOP ID and stored name
export const getBlobPath = (storedName: string, sopId: string): string => {
  return `${SOP_ATTACHMENTS_SUBDIR}/${sopId}/${storedName}`;
};