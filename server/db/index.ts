// taskforge-nuxt/server/db/index.ts
import mongoose from "mongoose";

let isConnected = false; // Track connection status

export const connectDB = async () => {
  if (isConnected) {
    console.log("=> Using existing database connection");
    return;
  }

  try {
    const config = useRuntimeConfig(); // Access runtime config for DB_URL
    if (!config.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in runtime config.");
    }

    const db = await mongoose.connect(config.MONGODB_URI, {
      // useNewUrlParser: true, // Deprecated in Mongoose 6+
      // useUnifiedTopology: true, // Deprecated in Mongoose 6+
      dbName: "taskforge", // Specify your database name
       
    });

    isConnected = db.connections[0].readyState === 1; // Check connection state
    console.log("=> MongoDB connected successfully!");
  } catch (error) {
    console.error("=> Error connecting to MongoDB:", error);
    isConnected = false;
    // In a production app, you might want to rethrow or exit process
    throw new Error("Database connection failed.");
  }
};

// Ensure database connection is established when server starts
// Nuxt server lifecycle hooks are not directly available here in `server/db/index.ts`
// We will call `connectDB()` from server API routes that need it.
