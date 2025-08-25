// types/sop.ts

export interface ISopAttachment {
  id: string; // Unique ID for the attachment (will be generated on backend)
  originalName: string;
  storedName: string; // Name under which it's saved on disk/S3
  mimeType: string;
  size: number; // in bytes
  path: string; // Local file path or S3 key
  url: string; // Publicly accessible URL for download/preview
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export interface ISop {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  attachments: ISopAttachment[]; // NEW: Array of attachments
}