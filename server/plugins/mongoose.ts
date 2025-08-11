// server/plugins/mongoose.ts
import mongoose from 'mongoose';
import { useRuntimeConfig } from '#imports';

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig();

  if (!config.private.mongodbUri) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in runtimeConfig.');
   
    return;
  }

  try {
    // Set a longer buffer timeout globally just in case, but the plugin should prevent it.
    mongoose.set('bufferTimeoutMS', 30000);
    
    await mongoose.connect(config.private.mongodbUri, {
      dbName: 'taskforge_db', // Or extract from URI if you prefer
    });
    console.log('✅ MongoDB connection established on server startup.');
  } catch (err) {
    console.error('❌ Could not connect to MongoDB on server startup:', err);
  }
});