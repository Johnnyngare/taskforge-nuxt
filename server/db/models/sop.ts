// server/db/models/sop.ts

import mongoose, { Schema, model, Document } from 'mongoose';
import type { ISop } from '~/types/sop';

// This interface is for Mongoose's internal use
export interface ISopModel extends Document, Omit<ISop, 'id' | 'author'> {
  authorId: mongoose.Types.ObjectId;
}

const SopSchema = new Schema<ISopModel>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true, // Handles createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      // --- THE FIX IS HERE ---
      // By typing `ret` as `any`, we tell TypeScript that we are
      // intentionally manipulating this object's shape, which resolves all errors.
      transform(doc, ret: any) {
        ret.id = ret._id;

        // When we populate authorId, Mongoose puts the populated object there.
        // We transform it into the structure our ISop interface expects.
        // This check correctly handles cases where authorId is populated (an object)
        // vs. not populated (an ObjectId).
        if (ret.authorId && typeof ret.authorId === 'object') {
          ret.author = {
            id: ret.authorId._id,
            name: ret.authorId.name,
          };
        }

        // Clean up the internal fields we don't want to send to the client.
        delete ret._id;
        delete ret.__v;
        delete ret.authorId;

        return ret;
      },
    },
  }
);

// Use the existing model if it's already been compiled, otherwise compile it.
// This is important for Nuxt's hot-reloading environment.
export const SopModel =
  mongoose.models.Sop || model<ISopModel>('Sop', SopSchema);