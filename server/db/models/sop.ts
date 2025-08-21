// server/db/models/sop.ts

import mongoose, { Schema, model, type Document } from 'mongoose';
import type { ISop, ISopAttachment } from '~/types/sop'; // NEW: Import ISop and ISopAttachment

// This interface is for Mongoose's internal use for the main SOP document
export interface ISopModel extends Document, Omit<ISop, 'id' | 'author' | 'attachments'> {
  authorId: mongoose.Types.ObjectId;
  attachments: ISopAttachment[]; // Add attachments array to the Mongoose Model interface
}

// NEW: Sub-schema for individual attachments (embedded directly in SopSchema)
const SopAttachmentSchema = new Schema<ISopAttachment>(
  {
    id: { type: String, required: true }, // Unique ID for the attachment (UUID generated on backend)
    originalName: { type: String, required: true },
    storedName: { type: String, required: true }, // Name under which it's saved on disk/S3
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // in bytes
    path: { type: String, required: true }, // Local file path or S3 key
    url: { type: String, required: true }, // Publicly accessible URL for download/preview
    uploadedAt: { type: Date, default: Date.now, required: true },
    uploadedBy: { // Store basic user info for traceability
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { _id: false } // Crucial: Do not create a separate _id for embedded sub-documents
);


const SopSchema = new Schema<ISopModel>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: { type: [SopAttachmentSchema], default: [] }, // NEW: Add the attachments array using the sub-schema
  },
  {
    timestamps: true, // Handles createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      transform(doc, ret: any) { // Type 'ret' as 'any' to allow property manipulation
        ret.id = ret._id; // Map _id to id

        // Transform authorId to author object if populated
        if (ret.authorId && typeof ret.authorId === 'object' && ret.authorId.name) {
    ret.author = {
      id: ret.authorId._id.toString(),
      name: ret.authorId.name,
    };
  } else if (ret.authorId) { // authorId exists but wasn't populated (is an ObjectId string)
    // You might decide to return author: { id: ret.authorId.toString(), name: 'Deleted User' } or null
    ret.author = { id: ret.authorId.toString(), name: 'Unknown User' };
  } else { // authorId is null or undefined (shouldn't happen if required)
    ret.author = null; // Explicitly set to null to avoid 'undefined'
  }
  // --- END THE FIX ---

        // Transform attachments if populated (optional, depends on need for nested user data)
        // If attachments were populated with full user objects, you'd transform them here.
        // For now, it directly matches ISopAttachment.

        // Clean up internal Mongoose fields
        delete ret._id;
        delete ret.__v;
        delete ret.authorId; // Remove original authorId after transformation

        return ret;
      },
    },
  }
);

// Use the existing model if it's already been compiled, otherwise compile it.
export const SopModel =
  mongoose.models.Sop || model<ISopModel>('Sop', SopSchema);