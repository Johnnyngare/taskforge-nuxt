// server/db/models/sop.ts

import mongoose, { Schema, model, type Document } from 'mongoose';
import type { ISop, ISopAttachment } from '~/types/sop';

// Sub-schema for individual attachments (embedded directly in SopSchema)
const SopAttachmentSchema = new Schema<ISopAttachment>(
  {
    id: { type: String, required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: false },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now, required: true },
    uploadedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { _id: false }
);

// Main SOP Model Interface
export interface ISopModel extends Document, Omit<ISop, 'id' | 'author' | 'attachments'> {
  authorId: mongoose.Types.ObjectId;
  attachments: ISopAttachment[];
}

const SopSchema = new Schema<ISopModel>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: { type: [SopAttachmentSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret: any) {
        ret.id = ret._id;

        // Transform authorId to author object if populated
        if (ret.authorId && typeof ret.authorId === 'object' && ret.authorId.name) {
          ret.author = {
            id: ret.authorId._id.toString(),
            name: ret.authorId.name,
          };
        } else if (ret.authorId) { // If authorId is just an ObjectId string (not populated)
          ret.author = { id: ret.authorId.toString(), name: 'Unknown User' }; // Fallback
        } else { // Should not happen if authorId is required
          ret.author = null;
        }

        // --- Crucial: Ensure attachments are simply passed through ---
        // If 'attachments' is a direct schema field, it will be in 'ret' automatically.
        // DO NOT delete ret.attachments here.

        delete ret._id;
        delete ret.__v;
        delete ret.authorId; // Remove original authorId after transformation
        return ret;
      },
    },
  }
);

export const SopModel =
  mongoose.models.Sop || model<ISopModel>('Sop', SopSchema);