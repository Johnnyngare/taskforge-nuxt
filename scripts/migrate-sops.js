// scripts/migrate-sops.js
// Run this script from your project root: `node --loader ts-node/esm --no-warnings scripts/migrate-sops.js`

// Use ES Module (ESM) syntax for all imports
import dotenv from 'dotenv';
import mongoose from 'mongoose'; // Directly import mongoose here
import path from 'path';
import { fileURLToPath } from 'url';

// --- Temporary Model Definition for Migration Script ONLY ---
// This avoids complex import issues with the transpiled Nuxt models.
// Replicates the essential parts of server/db/models/sop.ts
const SopAttachmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now, required: true },
    uploadedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { _id: false }
);

const SopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: { type: [SopAttachmentSchema], default: [] },
  },
  { timestamps: true } // Only necessary options for migration
);

// Register the model if it hasn't been already
const SopModel = mongoose.models.Sop || mongoose.model('Sop', SopSchema);

// --- End Temporary Model Definition ---


// Get __dirname equivalent in ESM scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Explicitly load environment variables from .env file
dotenv.config();

// 2. Define MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in your .env file.');
    console.error('Please ensure you have a .env file in your project root with MONGODB_URI=your_mongodb_connection_string');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for migration.');
  } catch (connectError) {
    console.error('Error connecting to MongoDB:', connectError);
    // If connection fails, ensure mongoose.disconnect is not called without a connection
    process.exit(1);
  }

  try {
    console.log('Starting migration: Checking for SOPs without attachments array...');
    const result = await SopModel.updateMany(
      { attachments: { $exists: false } },
      { $set: { attachments: [] } }
    );
    console.log(`Migration complete: ${result.nModified} SOPs updated to include empty attachments array.`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

// Execute the migration function
migrate();