// server/plugins/mongoose.ts

import mongoose from 'mongoose';
import type { RuntimeConfig } from '@nuxt/schema';
import { useRuntimeConfig } from '#imports';

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig() as RuntimeConfig;
  const mongoUri = config.private.mongodbUri;

  if (!mongoUri) {
    console.error('MongoDB URI is not defined. The application cannot start.');
    // In a real app, you might want to throw an error to stop the server from starting
    return;
  }

  try {
    // Set the buffer timeout globally here as well, just in case.
    mongoose.set('bufferTimeoutMS', 30000);
    await mongoose.connect(mongoUri, { dbName: 'taskforge_db' });
    console.log('✅ MongoDB connection established on server startup.');
  } catch (err) {
    console.error('❌ Could not connect to MongoDB on server startup:', err);
  }
});