// server/plugins/mongoose.ts
import mongoose from 'mongoose';

export default defineNitroPlugin(async (nitroApp) => {
  // Access runtime config (from nuxt.config.ts)
  const config = useRuntimeConfig();

  // Check if MONGODB_URI is provided
  if (!config.MONGODB_URI) {
    console.error('MONGO_URI is not defined in runtimeConfig!');
    return; // Don't try to connect if URI is missing
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(config.MONGODB_URI, {
      dbName: 'taskforge', // Specify your database name here
      // Remove useNewUrlParser and useUnifiedTopology as they are no longer supported/needed
    });
    console.log('✅ Connected to MongoDB!');
  } catch (err) {
    console.error('❌ Could not connect to MongoDB:', err);
  }
});